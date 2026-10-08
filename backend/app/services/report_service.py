import os
import uuid
from pathlib import Path
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

def generate_pdf_report(analysis_dict: Dict[str, Any], output_filename: str) -> str:
    """
    Generates an executive-grade ATS audit PDF report using ReportLab.
    """
    report_path = settings.REPORTS_DIR / output_filename
    doc = SimpleDocTemplate(
        str(report_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom modern typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A')
    )
    
    sub_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#64748B')
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    bold_body = ParagraphStyle(
        'DocBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    elements = []

    # Header Banner
    candidate_name = analysis_dict.get("candidate_name") or "Candidate"
    job_title = analysis_dict.get("job_title", "Software Engineering Role")
    company = analysis_dict.get("company", "Target Enterprise")
    overall_score = analysis_dict.get("overall_score", 0.0)

    header_table_data = [
        [
            Paragraph("<b>RESUMEX-CLOUD</b> | ATS Audit Report", title_style),
            Paragraph(f"<font size=16 color='#0284C7'><b>{overall_score}%</b></font><br/><font size=8 color='#64748B'>OVERALL ATS MATCH</font>", ParagraphStyle('ScoreBadge', parent=styles['Normal'], alignment=2))
        ],
        [
            Paragraph(f"Candidate: <b>{candidate_name}</b> &nbsp;|&nbsp; Target Role: <b>{job_title}</b> ({company})", sub_style),
            Paragraph(f"Report ID: {str(uuid.uuid4())[:8].upper()}", sub_style)
        ]
    ]
    t_header = Table(header_table_data, colWidths=[380, 160])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_header)
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=12))

    # Executive Summary Box
    summary_text = analysis_dict.get("executive_summary", "Comprehensive resume alignment analysis complete.")
    summary_box_data = [[Paragraph(f"<b>Executive Summary:</b> {summary_text}", body_style)]]
    t_sum = Table(summary_box_data, colWidths=[540])
    t_sum.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(t_sum)
    elements.append(Spacer(1, 10))

    # Transparent Scoring Breakdown Table
    elements.append(Paragraph("Transparent ATS Scoring Breakdown (Weights & Factors)", h2_style))
    breakdown = analysis_dict.get("breakdown", {})
    breakdown_rows = [
        ["Evaluation Dimension", "Weight", "Score", "Weighted", "Audit Analysis Explanation"]
    ]
    for key, item in breakdown.items():
        name = key.replace("_", " ").title()
        breakdown_rows.append([
            name,
            f"{int(item.get('weight_percentage', 0))}%",
            f"{item.get('score', 0)}%",
            f"{item.get('weighted_score', 0)}",
            Paragraph(item.get('explanation', ''), body_style)
        ])

    t_breakdown = Table(breakdown_rows, colWidths=[120, 45, 45, 55, 275])
    t_breakdown.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_breakdown)
    elements.append(Spacer(1, 10))

    # Critical Skill Gaps Table
    elements.append(Paragraph("Critical Skill Gaps & Deficits", h2_style))
    missing_kws = analysis_dict.get("missing_keywords", [])
    gap_rows = [["Missing Technology / Competency", "Category", "Importance", "Occurrences in JD", "Suggested Action"]]
    for m in missing_kws[:6]:
        gap_rows.append([
            m.get("keyword", ""),
            m.get("category", ""),
            m.get("importance", ""),
            f"{m.get('job_occurrences', 1)}x",
            Paragraph(m.get("recommendation", ""), body_style)
        ])
    if len(gap_rows) == 1:
        gap_rows.append(["None", "All mandatory skills matched", "N/A", "0x", Paragraph("No critical gaps detected.", body_style)])

    t_gaps = Table(gap_rows, colWidths=[130, 95, 65, 55, 195])
    t_gaps.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_gaps)
    elements.append(Spacer(1, 10))

    # Top Prioritized Recommendations
    elements.append(Paragraph("Actionable Optimization Roadmap", h2_style))
    recs = analysis_dict.get("recommendations", [])
    for rec in recs[:4]:
        rec_box = [
            [
                Paragraph(f"<b>[{rec.get('priority_label', 'Priority')}] {rec.get('title', '')}</b>", bold_body),
                Paragraph(f"<font color='#059669'><b>Impact: {rec.get('expected_impact', '')}</b></font>", ParagraphStyle('Imp', parent=body_style, alignment=2))
            ],
            [
                Paragraph(f"<b>Problem:</b> {rec.get('problem', '')}<br/><b>Action:</b> {rec.get('suggested_action', '')}", body_style),
                ""
            ]
        ]
        t_rec = Table(rec_box, colWidths=[400, 140])
        t_rec.setStyle(TableStyle([
            ('SPAN', (0, 1), (1, 1)),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t_rec)
        elements.append(Spacer(1, 4))

    elements.append(Spacer(1, 8))
    # Footer Notice
    footer_text = "Generated by Resumex-Cloud Intelligence Platform. Confidential document for candidate & authorized recruiter evaluation."
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=sub_style, alignment=1)))

    doc.build(elements)
    return str(report_path)
