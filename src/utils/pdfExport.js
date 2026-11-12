// PDF Health Report Generator
// Uses jsPDF (loaded dynamically) to create offline PDF reports

export async function generateHealthReport(user, sessions, journal, patterns) {
  // Dynamically import jsPDF to keep bundle small
  let jsPDF
  try {
    const module = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    jsPDF = window.jspdf?.jsPDF || module?.jsPDF
  } catch (e) {
    console.error('jsPDF load error:', e)
    // Fallback: generate plain text report
    return generateTextReport(user, sessions, journal, patterns)
  }

  if (!jsPDF) return generateTextReport(user, sessions, journal, patterns)

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const W = 210, margin = 20
  let y = margin

  const green  = [0, 168, 107]
  const dark   = [13, 31, 26]
  const slate  = [61, 82, 71]
  const cream  = [247, 251, 249]
  const white  = [255, 255, 255]

  const addPage = () => { doc.addPage(); y = margin }
  const checkPage = (needed = 20) => { if (y + needed > 280) addPage() }

  // ── Cover ────────────────────────────────────────────────────
  doc.setFillColor(...dark)
  doc.rect(0, 0, W, 297, 'F')
  doc.setFillColor(...green)
  doc.rect(0, 0, 8, 297, 'F')

  doc.setTextColor(...green)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('SayMyDoc', margin, 60)

  doc.setTextColor(...white)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Personal Health Report', margin, 72)

  doc.setTextColor(139, 169, 154)
  doc.setFontSize(10)
  doc.text(`Generated for: ${user?.name || 'User'}`, margin, 90)
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 98)
  doc.text(`Location: ${user?.location || 'Uganda'}`, margin, 106)

  // Green divider
  doc.setDrawColor(...green)
  doc.setLineWidth(1)
  doc.line(margin, 120, W - margin, 120)

  doc.setTextColor(139, 169, 154)
  doc.setFontSize(9)
  doc.text('Created by SayMyTech Developers — Kampala, Uganda', margin, 130)
  doc.text('"Because understanding your health is a human right."', margin, 138)

  doc.addPage()
  y = margin

  // ── Health Summary ───────────────────────────────────────────
  doc.setFillColor(...white)
  doc.rect(0, 0, W, 297, 'F')

  doc.setTextColor(...dark)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Health Summary', margin, y)
  y += 8

  doc.setDrawColor(...green)
  doc.setLineWidth(0.5)
  doc.line(margin, y, W - margin, y)
  y += 8

  // User info box
  doc.setFillColor(232, 248, 241)
  doc.roundedRect(margin, y, W - 2 * margin, 30, 3, 3, 'F')
  doc.setTextColor(...slate)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('USER PROFILE', margin + 5, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${user?.name || '—'}   Age: ${user?.age || '—'}   Sex: ${user?.sex || '—'}   Location: ${user?.location || '—'}`, margin + 5, y + 16)
  doc.text(`Report period: Last 30 days   Total health checks: ${sessions?.length || 0}   Journal entries: ${journal?.length || 0}`, margin + 5, y + 24)
  y += 38

  // ── Recent Symptom Checks ───────────────────────────────────
  checkPage(20)
  doc.setTextColor(...dark)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Recent Symptom Checks', margin, y)
  y += 7

  if (!sessions?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...slate)
    doc.text('No symptom checks recorded yet.', margin, y)
    y += 10
  } else {
    sessions.slice(0, 10).forEach((s, i) => {
      checkPage(18)
      const condName = s.primary_condition?.replace(/_/g, ' ') || 'Health Check'
      const date = new Date(s.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      const conf = s.confidence || 0

      doc.setFillColor(i % 2 === 0 ? 247 : 255, i % 2 === 0 ? 251 : 255, i % 2 === 0 ? 249 : 255)
      doc.rect(margin, y, W - 2 * margin, 14, 'F')

      doc.setTextColor(...dark)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(condName.charAt(0).toUpperCase() + condName.slice(1), margin + 3, y + 6)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...slate)
      doc.text(date, W - margin - 50, y + 6)
      doc.text(`${conf}% confidence`, W - margin - 25, y + 6)

      if (s.result?.see_doctor_if?.[0]) {
        doc.setFontSize(8)
        doc.setTextColor(139, 169, 154)
        doc.text(`⚕ ${s.result.see_doctor_if[0].substring(0, 70)}`, margin + 3, y + 11)
      }
      y += 15
    })
    y += 5
  }

  // ── Pattern Insights ─────────────────────────────────────────
  if (patterns?.insights?.length > 0) {
    checkPage(30)
    doc.setTextColor(...dark)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('AI Health Insights', margin, y)
    y += 7

    patterns.insights.slice(0, 3).forEach(ins => {
      checkPage(30)
      doc.setFillColor(232, 248, 241)
      doc.roundedRect(margin, y, W - 2 * margin, 28, 3, 3, 'F')
      doc.setFillColor(...green)
      doc.rect(margin, y, 3, 28, 'F')

      doc.setTextColor(...green)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${ins.icon} ${ins.title}`, margin + 6, y + 8)

      doc.setTextColor(...dark)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const bodyLines = doc.splitTextToSize(ins.body, W - 2 * margin - 12)
      doc.text(bodyLines.slice(0, 2), margin + 6, y + 15)

      doc.setTextColor(0, 100, 60)
      doc.setFontSize(8)
      doc.text(`→ ${ins.actionable}`, margin + 6, y + 23)
      y += 32
    })
    y += 5
  }

  // ── Journal Summary ───────────────────────────────────────────
  if (journal?.length > 0) {
    checkPage(50)
    doc.setTextColor(...dark)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Journal Summary (Last 7 Days)', margin, y)
    y += 7

    const week = journal.slice(0, 7)
    const avg = (key, def) => week.reduce((s, e) => s + (e[key] || def), 0) / week.length
    const avgMood = avg('mood', 3).toFixed(1)
    const avgSleep = avg('sleep', 7).toFixed(1)
    const avgWater = avg('water', 6).toFixed(1)
    const avgStress = avg('stress', 3).toFixed(1)

    const stats = [
      ['Average Mood', `${avgMood}/5`], ['Average Sleep', `${avgSleep} hours`],
      ['Average Water', `${avgWater} glasses`], ['Average Stress', `${avgStress}/5`],
    ]

    doc.setFillColor(28, 43, 38)
    doc.roundedRect(margin, y, W - 2 * margin, 20, 3, 3, 'F')

    stats.forEach((s, i) => {
      const x = margin + 5 + (i * (W - 2 * margin - 10) / 4)
      doc.setTextColor(139, 169, 154)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(s[0], x, y + 8)
      doc.setTextColor(...green)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(s[1], x, y + 16)
    })
    y += 28
  }

  // ── Medical Disclaimer ───────────────────────────────────────
  checkPage(30)
  doc.setFillColor(255, 248, 231)
  doc.roundedRect(margin, y, W - 2 * margin, 25, 3, 3, 'F')
  doc.setTextColor(180, 100, 0)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Medical Disclaimer', margin + 5, y + 8)
  doc.setFont('helvetica', 'normal')
  const disclaimer = 'SayMyDoc provides health guidance and education, not medical diagnosis. This report is for personal reference only. Always consult a qualified healthcare professional for medical decisions. In an emergency, go to hospital immediately.'
  const discLines = doc.splitTextToSize(disclaimer, W - 2 * margin - 10)
  doc.text(discLines, margin + 5, y + 15)
  y += 30

  // Footer
  doc.setTextColor(139, 169, 154)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`© 2026 SayMyTech Developers | SayMyDoc v1.0 | Generated ${new Date().toLocaleString('en-GB')}`, margin, 287)

  // Save
  const filename = `SayMyDoc_Health_Report_${user?.name?.replace(/\s/g, '_') || 'User'}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  return { success: true, filename }
}

function generateTextReport(user, sessions, journal, patterns) {
  // Fallback plain text download
  const lines = [
    '=== YOSYMPTOM HEALTH REPORT ===',
    `Generated for: ${user?.name || 'User'}`,
    `Date: ${new Date().toLocaleDateString('en-GB')}`,
    '',
    '--- RECENT SYMPTOM CHECKS ---',
    ...(sessions || []).slice(0, 10).map(s =>
      `• ${s.primary_condition?.replace(/_/g, ' ') || 'Health Check'} — ${s.confidence || 0}% confidence — ${new Date(s.timestamp).toLocaleDateString('en-GB')}`
    ),
    '',
    '--- AI INSIGHTS ---',
    ...(patterns?.insights || []).map(i => `• ${i.title}: ${i.actionable}`),
    '',
    '--- DISCLAIMER ---',
    'SayMyDoc provides health guidance, not medical diagnosis.',
    'Always consult a qualified healthcare professional.',
    '',
    '© 2026 SayMyTech Developers',
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `SayMyDoc_Report_${user?.name || 'User'}_${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
  return { success: true, filename: a.download }
}
