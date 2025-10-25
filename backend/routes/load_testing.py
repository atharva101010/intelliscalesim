from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database import get_db
from models.load_test import LoadTest
import load_tester

# PDF export imports
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime as dt

router = APIRouter()

@router.post("/api/load-test/start")
async def start_load_test(
    request: load_tester.LoadTestRequest,
    db: Session = Depends(get_db)
):
    """Start a new load test and save to database"""
    try:
        # Start the load test
        test_id = load_tester.start_load_test(request)
        
        # Save to database (user_id = 1 for now, until auth is added)
        db_test = LoadTest(
            test_id=test_id,
            user_id=1,  # Default user for now
            target_url=request.target_url,
            total_requests=request.total_requests,
            concurrency=request.concurrency,
            duration_seconds=request.duration_seconds,
            method=request.method,
            status='running',
            progress=0.0
        )
        db.add(db_test)
        db.commit()
        db.refresh(db_test)
        
        return {"test_id": test_id, "message": "Load test started successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/load-test/{test_id}")
async def get_load_test_result(
    test_id: str,
    db: Session = Depends(get_db)
):
    """Get real-time load test result"""
    # Get from memory (real-time)
    result = load_tester.get_test_result(test_id)
    
    if not result:
        # Try to get from database
        db_test = db.query(LoadTest).filter(
            LoadTest.test_id == test_id
        ).first()
        
        if not db_test:
            raise HTTPException(status_code=404, detail="No completed tests found")
        
        return db_test
    
    # Update database with latest results
    db_test = db.query(LoadTest).filter(LoadTest.test_id == test_id).first()
    if db_test:
        db_test.status = result.status
        db_test.progress = result.progress
        db_test.completed_requests = result.completed_requests
        db_test.failed_requests = result.failed_requests
        db_test.avg_response_time = result.avg_response_time
        db_test.min_response_time = result.min_response_time
        db_test.max_response_time = result.max_response_time
        db_test.requests_per_second = result.requests_per_second
        db_test.actual_duration = result.actual_duration
        db_test.cpu_usage = result.cpu_usage
        db_test.memory_usage = result.memory_usage
        
        if result.status == 'completed' and result.completed_at:
            db_test.completed_at = datetime.fromisoformat(result.completed_at)
        
        db.commit()
    
    return result

@router.get("/api/load-test/history/all")
async def get_all_load_tests(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all load tests from database"""
    tests = db.query(LoadTest).order_by(LoadTest.created_at.desc()).offset(skip).limit(limit).all()
    return tests

@router.delete("/api/load-test/{test_id}")
async def delete_load_test(
    test_id: str,
    db: Session = Depends(get_db)
):
    """Delete a load test"""
    db_test = db.query(LoadTest).filter(
        LoadTest.test_id == test_id
    ).first()
    
    if not db_test:
        raise HTTPException(status_code=404, detail="No completed tests found")
    
    db.delete(db_test)
    db.commit()
    
    # Also remove from memory if exists
    load_tester.delete_test(test_id)
    
    return {"message": "Test deleted successfully"}

# Export endpoints
from fastapi.responses import StreamingResponse, Response
import io
import csv
import json

@router.get("/api/load-test/{test_id}/export/csv")
async def export_test_csv(
    test_id: str,
    db: Session = Depends(get_db)
):
    """Export test result as CSV"""
    test = db.query(LoadTest).filter(LoadTest.test_id == test_id).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="No completed tests found")
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow([
        'Test ID', 'Target URL', 'Status', 'Total Requests', 
        'Completed Requests', 'Failed Requests', 'Avg Response Time (ms)',
        'Min Response Time (ms)', 'Max Response Time (ms)', 
        'Requests/sec', 'Duration (s)', 'Started At', 'Completed At'
    ])
    
    # Write data
    writer.writerow([
        test.test_id,
        test.target_url,
        test.status,
        test.total_requests,
        test.completed_requests,
        test.failed_requests,
        round(test.avg_response_time, 2),
        round(test.min_response_time, 2),
        round(test.max_response_time, 2),
        round(test.requests_per_second, 2),
        round(test.actual_duration, 2) if test.actual_duration else 0,
        test.started_at,
        test.completed_at
    ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=load_test_{test_id}.csv"}
    )

@router.get("/api/load-test/{test_id}/export/json")
async def export_test_json(
    test_id: str,
    db: Session = Depends(get_db)
):
    """Export test result as JSON"""
    test = db.query(LoadTest).filter(LoadTest.test_id == test_id).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="No completed tests found")
    
    # Create JSON export
    export_data = {
        "test_id": test.test_id,
        "target_url": test.target_url,
        "configuration": {
            "total_requests": test.total_requests,
            "concurrency": test.concurrency,
            "duration_seconds": test.duration_seconds,
            "method": test.method
        },
        "results": {
            "status": test.status,
            "completed_requests": test.completed_requests,
            "failed_requests": test.failed_requests,
            "progress": test.progress
        },
        "performance_metrics": {
            "avg_response_time": round(test.avg_response_time, 2),
            "min_response_time": round(test.min_response_time, 2),
            "max_response_time": round(test.max_response_time, 2),
            "requests_per_second": round(test.requests_per_second, 2),
            "actual_duration": round(test.actual_duration, 2) if test.actual_duration else 0
        },
        "system_metrics": {
            "cpu_usage": test.cpu_usage,
            "memory_usage": test.memory_usage
        },
        "timestamps": {
            "started_at": test.started_at.isoformat() if test.started_at else None,
            "completed_at": test.completed_at.isoformat() if test.completed_at else None
        }
    }
    
    json_str = json.dumps(export_data, indent=2)
    
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=load_test_{test_id}.json"}
    )

@router.post("/api/load-test/compare")
async def compare_tests(
    test_ids: List[str],
    db: Session = Depends(get_db)
):
    """Compare multiple test results"""
    if len(test_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 tests required for comparison")
    
    if len(test_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 tests can be compared")
    
    tests = db.query(LoadTest).filter(LoadTest.test_id.in_(test_ids)).all()
    
    if len(tests) != len(test_ids):
        raise HTTPException(status_code=404, detail="One or more tests not found")
    
    # Create comparison data
    comparison = {
        "test_count": len(tests),
        "tests": []
    }
    
    for test in tests:
        comparison["tests"].append({
            "test_id": test.test_id,
            "target_url": test.target_url,
            "total_requests": test.total_requests,
            "completed_requests": test.completed_requests,
            "failed_requests": test.failed_requests,
            "success_rate": round((test.completed_requests / test.total_requests * 100), 2) if test.total_requests > 0 else 0,
            "avg_response_time": round(test.avg_response_time, 2),
            "min_response_time": round(test.min_response_time, 2),
            "max_response_time": round(test.max_response_time, 2),
            "requests_per_second": round(test.requests_per_second, 2),
            "actual_duration": round(test.actual_duration, 2) if test.actual_duration else 0,
            "started_at": test.started_at.isoformat() if test.started_at else None
        })
    
    # Calculate comparison metrics
    comparison["summary"] = {
        "best_avg_response_time": min(t["avg_response_time"] for t in comparison["tests"]),
        "worst_avg_response_time": max(t["avg_response_time"] for t in comparison["tests"]),
        "best_requests_per_second": max(t["requests_per_second"] for t in comparison["tests"]),
        "worst_requests_per_second": min(t["requests_per_second"] for t in comparison["tests"]),
        "avg_success_rate": round(sum(t["success_rate"] for t in comparison["tests"]) / len(tests), 2)
    }
    
    return comparison





@router.get("/api/load-test/{test_id}/export/pdf")
async def export_test_pdf(test_id: str, db: Session = Depends(get_db)):
    """Export comprehensive PDF report - Enhanced for Students"""
    test = db.query(LoadTest).filter(LoadTest.test_id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="No completed tests found")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, 
                           topMargin=0.5*inch, bottomMargin=0.5*inch,
                           leftMargin=0.75*inch, rightMargin=0.75*inch)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], 
                                fontSize=28, textColor=colors.HexColor('#f97316'), 
                                alignment=TA_CENTER, spaceAfter=30, fontName='Helvetica-Bold')
    
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], 
                                  fontSize=18, textColor=colors.HexColor('#1f2937'),
                                  spaceAfter=15, spaceBefore=20, fontName='Helvetica-Bold')
    
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], 
                                 fontSize=11, textColor=colors.HexColor('#374151'))
    
    # === TITLE PAGE ===
    elements.append(Paragraph("🚀 Load Testing Report", title_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph(f"Test ID: {test.test_id[:16]}...", 
                             ParagraphStyle('Subtitle', parent=normal_style, alignment=TA_CENTER, fontSize=10)))
    elements.append(Spacer(1, 0.4*inch))
    
    # === 1. TEST SUMMARY ===
    elements.append(Paragraph("📋 Test Summary", section_style))
    
    summary_data = [
        ['Parameter', 'Value', 'Status'],
        ['Test ID', test.test_id[:20] + '...', '✓'],
        ['Target URL', test.target_url, '✓'],
        ['HTTP Method', test.method, '✓'],
        ['Test Status', test.status.upper(), '✓' if test.status == 'completed' else '!'],
        ['Started At', test.started_at.strftime('%Y-%m-%d %H:%M:%S') if test.started_at else 'N/A', '✓'],
        ['Completed At', test.completed_at.strftime('%Y-%m-%d %H:%M:%S') if test.completed_at else 'N/A', 
         '✓' if test.completed_at else '-'],
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 3.2*inch, 0.6*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#eff6ff')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # === 2. TEST CONFIGURATION ===
    elements.append(Paragraph("⚙️ Test Configuration", section_style))
    
    config_data = [
        ['Configuration', 'Target', 'Actual', 'Match'],
        ['Total Requests', str(test.total_requests), str(test.completed_requests + test.failed_requests),
         '✓' if (test.completed_requests + test.failed_requests) == test.total_requests else '!'],
        ['Concurrency Level', str(test.concurrency), str(test.concurrency), '✓'],
        ['Target Duration', f"{test.duration_seconds}s", 
         f"{test.actual_duration:.2f}s" if test.actual_duration else 'N/A',
         '✓' if test.actual_duration and abs(test.actual_duration - test.duration_seconds) < 5 else '!'],
    ]
    
    config_table = Table(config_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 0.8*inch])
    config_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f3e8ff')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(config_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # === 3. RESULTS SUMMARY ===
    elements.append(Paragraph("📊 Results Summary", section_style))
    
    success_rate = (test.completed_requests / test.total_requests * 100) if test.total_requests > 0 else 0
    failure_rate = (test.failed_requests / test.total_requests * 100) if test.total_requests > 0 else 0
    
    results_data = [
        ['Metric', 'Value', 'Percentage', 'Status'],
        ['Total Requests', str(test.total_requests), '100%', '✓'],
        ['✓ Successful Requests', str(test.completed_requests), f'{success_rate:.2f}%',
         '✓' if success_rate == 100 else '!'],
        ['✗ Failed Requests', str(test.failed_requests), f'{failure_rate:.2f}%',
         '✓' if failure_rate == 0 else '✗'],
        ['Requests per Second', f"{test.requests_per_second:.2f}", '-', 
         '✓' if test.requests_per_second > 10 else '!'],
        ['Test Duration', f"{test.actual_duration:.2f}s" if test.actual_duration else 'N/A', '-', '✓'],
    ]
    
    results_table = Table(results_data, colWidths=[2*inch, 1.5*inch, 1.3*inch, 1*inch])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#d1fae5')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(results_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # === 4. PERFORMANCE METRICS ===
    elements.append(Paragraph("⚡ Performance Metrics", section_style))
    
    response_range = test.max_response_time - test.min_response_time
    
    perf_data = [
        ['Metric', 'Value (ms)', 'Rating'],
        ['Average Response Time', f"{test.avg_response_time:.2f}", 
         '⭐⭐⭐' if test.avg_response_time < 50 else '⭐⭐' if test.avg_response_time < 200 else '⭐'],
        ['Minimum Response Time', f"{test.min_response_time:.2f}", '✓'],
        ['Maximum Response Time', f"{test.max_response_time:.2f}", 
         '!' if test.max_response_time > 1000 else '✓'],
        ['Response Time Range', f"{response_range:.2f}", 
         '✓' if response_range < 500 else '!'],
        ['Standard Deviation', f"{response_range/4:.2f} (est.)", '-'],
    ]
    
    perf_table = Table(perf_data, colWidths=[2.5*inch, 2*inch, 1.3*inch])
    perf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ec4899')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#fce7f3')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(perf_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # === 5. SYSTEM RESOURCES ===
    if test.cpu_usage and test.memory_usage:
        elements.append(Paragraph("💻 System Resource Usage", section_style))
        
        avg_cpu = sum(test.cpu_usage) / len(test.cpu_usage) if test.cpu_usage else 0
        max_cpu = max(test.cpu_usage) if test.cpu_usage else 0
        avg_mem = sum(test.memory_usage) / len(test.memory_usage) if test.memory_usage else 0
        max_mem = max(test.memory_usage) if test.memory_usage else 0
        
        resource_data = [
            ['Resource', 'Average', 'Peak', 'Status'],
            ['CPU Usage', f"{avg_cpu:.1f}%", f"{max_cpu:.1f}%", 
             '✓' if max_cpu < 80 else '!' if max_cpu < 95 else '✗'],
            ['Memory Usage', f"{avg_mem:.1f}%", f"{max_mem:.1f}%",
             '✓' if max_mem < 80 else '!' if max_mem < 95 else '✗'],
        ]
        
        resource_table = Table(resource_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 0.8*inch])
        resource_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#fef3c7')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('ALIGN', (3, 0), (3, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(resource_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # === 6. ANALYSIS & RECOMMENDATIONS ===
    elements.append(Paragraph("💡 Performance Analysis & Recommendations", section_style))
    
    analysis_points = []
    
    # Success Rate Analysis
    if success_rate == 100:
        analysis_points.append("✅ <b>Excellent Reliability:</b> All requests completed successfully with 0% failure rate. Your application handles the load perfectly.")
    elif success_rate >= 95:
        analysis_points.append("✓ <b>Good Reliability:</b> Most requests completed successfully. Minor issues detected - review application logs for failed requests.")
    else:
        analysis_points.append("⚠️ <b>Reliability Concern:</b> Significant failure rate detected. Review application error handling and resource allocation.")
    
    # Performance Analysis
    if test.avg_response_time < 50:
        analysis_points.append("✅ <b>Outstanding Performance:</b> Average response time under 50ms indicates excellent application responsiveness.")
    elif test.avg_response_time < 200:
        analysis_points.append("✓ <b>Good Performance:</b> Response times under 200ms are acceptable for most web applications.")
    elif test.avg_response_time < 500:
        analysis_points.append("! <b>Moderate Performance:</b> Response times between 200-500ms may affect user experience. Consider optimization.")
    else:
        analysis_points.append("⚠️ <b>Performance Issue:</b> Response times exceed 500ms. Immediate optimization recommended - check database queries, caching, and resource bottlenecks.")
    
    # Throughput Analysis
    if test.requests_per_second > 100:
        analysis_points.append("✅ <b>Excellent Throughput:</b> Handling over 100 requests/second demonstrates strong scalability.")
    elif test.requests_per_second > 50:
        analysis_points.append("✓ <b>Good Throughput:</b> Handling 50+ requests/second is suitable for medium-traffic applications.")
    elif test.requests_per_second > 10:
        analysis_points.append("! <b>Moderate Throughput:</b> Consider horizontal scaling or optimization for higher traffic.")
    else:
        analysis_points.append("⚠️ <b>Low Throughput:</b> Less than 10 req/s indicates bottlenecks. Review application architecture and resource allocation.")
    
    # Concurrency Analysis
    analysis_points.append(f"📊 <b>Concurrency Level:</b> Test used {test.concurrency} concurrent connections. Consider testing with higher concurrency to simulate peak load.")
    
    # Recommendations
    recommendations = []
    if success_rate < 100:
        recommendations.append("• Review application logs to identify causes of failed requests")
        recommendations.append("• Implement proper error handling and retry mechanisms")
    
    if test.avg_response_time > 200:
        recommendations.append("• Optimize database queries and add appropriate indexes")
        recommendations.append("• Implement caching strategy (Redis, Memcached)")
        recommendations.append("• Consider CDN for static assets")
    
    if test.requests_per_second < 50:
        recommendations.append("• Consider horizontal scaling (add more instances)")
        recommendations.append("• Implement load balancing")
        recommendations.append("• Profile code to identify bottlenecks")
    
    recommendations.append("• Run tests periodically to track performance trends")
    recommendations.append("• Test with different concurrency levels to find optimal capacity")
    
    for point in analysis_points:
        elements.append(Paragraph(point, normal_style))
        elements.append(Spacer(1, 0.08*inch))
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("<b>📌 Recommendations:</b>", 
                             ParagraphStyle('Bold', parent=normal_style, fontName='Helvetica-Bold')))
    elements.append(Spacer(1, 0.08*inch))
    
    for rec in recommendations:
        elements.append(Paragraph(rec, normal_style))
        elements.append(Spacer(1, 0.05*inch))
    
    # === 7. CONCLUSION ===
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("🎯 Conclusion", section_style))
    
    if success_rate == 100 and test.avg_response_time < 200 and test.requests_per_second > 50:
        conclusion = "Your application demonstrates <b>excellent performance</b> under load. It successfully handled all requests with good response times and throughput. Continue monitoring and consider stress testing with higher loads."
    elif success_rate >= 95 and test.avg_response_time < 500:
        conclusion = "Your application shows <b>good performance</b> overall. Minor optimizations recommended to improve response times and reduce failure rate."
    else:
        conclusion = "Your application requires <b>optimization</b> before handling production traffic. Focus on improving reliability, response times, and throughput based on the recommendations above."
    
    elements.append(Paragraph(conclusion, normal_style))
    
    # === FOOTER ===
    elements.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], 
                                 fontSize=8, textColor=colors.HexColor('#6b7280'), 
                                 alignment=TA_CENTER)
    elements.append(Paragraph(
        f"Report Generated: {dt.now().strftime('%Y-%m-%d %H:%M:%S')} | IntelliScaleSim Load Testing Platform | For Educational Use",
        footer_style
    ))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=load_test_report_{test.test_id[:8]}.pdf"}
    )

# ============================================
# HISTORICAL TRENDS DASHBOARD
# ============================================

@router.get("/api/load-test/analytics/trends")
async def get_performance_trends(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get performance trends across multiple tests for dashboard visualization"""
    
    # Get last N completed tests, ordered by date
    tests = db.query(LoadTest).filter(
        LoadTest.status == 'completed'
    ).order_by(LoadTest.started_at.desc()).limit(limit).all()
    
    if not tests:
        return {
            "message": "No completed tests found",
            "has_data": False,
            "trends": [],
            "statistics": {}
        }
    
    # Reverse to show chronologically (oldest to newest)
    tests = list(reversed(tests))
    
    # Build trend data for charts
    trends = []
    for idx, test in enumerate(tests, 1):
        success_rate = (test.completed_requests / test.total_requests * 100) if test.total_requests > 0 else 0
        
        trends.append({
            "test_number": idx,
            "test_id": test.test_id,
            "test_id_short": test.test_id[:8],
            "date": test.started_at.strftime("%m/%d %H:%M") if test.started_at else "N/A",
            "full_date": test.started_at.isoformat() if test.started_at else None,
            "target_url": test.target_url,
            "avg_response_time": round(test.avg_response_time, 2),
            "min_response_time": round(test.min_response_time, 2),
            "max_response_time": round(test.max_response_time, 2),
            "requests_per_second": round(test.requests_per_second, 2),
            "success_rate": round(success_rate, 2),
            "total_requests": test.total_requests,
            "completed_requests": test.completed_requests,
            "failed_requests": test.failed_requests
        })
    
    # Calculate overall statistics
    avg_response = sum(t["avg_response_time"] for t in trends) / len(trends)
    avg_throughput = sum(t["requests_per_second"] for t in trends) / len(trends)
    avg_success = sum(t["success_rate"] for t in trends) / len(trends)
    
    best_test = min(trends, key=lambda x: x["avg_response_time"])
    worst_test = max(trends, key=lambda x: x["avg_response_time"])
    
    # Calculate trend direction (comparing first half vs second half)
    mid_point = len(trends) // 2
    if mid_point > 0:
        first_half_avg = sum(t["avg_response_time"] for t in trends[:mid_point]) / mid_point
        second_half_avg = sum(t["avg_response_time"] for t in trends[mid_point:]) / (len(trends) - mid_point)
        improvement_pct = ((first_half_avg - second_half_avg) / first_half_avg * 100) if first_half_avg > 0 else 0
        
        if improvement_pct > 5:
            trend_direction = "improving"
            trend_icon = "📈"
        elif improvement_pct < -5:
            trend_direction = "degrading"
            trend_icon = "📉"
        else:
            trend_direction = "stable"
            trend_icon = "➡️"
    else:
        improvement_pct = 0
        trend_direction = "insufficient_data"
        trend_icon = "➖"
    
    return {
        "has_data": True,
        "trends": trends,
        "statistics": {
            "total_tests": len(trends),
            "avg_response_time": round(avg_response, 2),
            "avg_throughput": round(avg_throughput, 2),
            "avg_success_rate": round(avg_success, 2),
            "best_response_time": best_test["avg_response_time"],
            "best_test_id": best_test["test_id_short"],
            "best_test_date": best_test["date"],
            "worst_response_time": worst_test["avg_response_time"],
            "worst_test_id": worst_test["test_id_short"],
            "worst_test_date": worst_test["date"],
            "trend_direction": trend_direction,
            "trend_icon": trend_icon,
            "improvement_percentage": round(improvement_pct, 2)
        }
    }


# ============================================
# TREND REPORT EXPORTS
# ============================================

from io import BytesIO, StringIO
from datetime import datetime
import csv
import json

