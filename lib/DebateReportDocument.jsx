import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const decisions = { advance: 'Avanzar', pivot: 'Pivotar', discard: 'Descartar' };
const stances = { support: 'A favor', caution: 'Con reservas', oppose: 'En contra' };
const confidence = { low: 'Baja', medium: 'Media', high: 'Alta' };

const styles = StyleSheet.create({
  page: { backgroundColor: '#f8fafc', color: '#172033', fontFamily: 'Helvetica', fontSize: 9, lineHeight: 1.45, paddingTop: 46, paddingHorizontal: 46, paddingBottom: 52 },
  header: { alignItems: 'center', borderBottomColor: '#dbe3f0', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 12 },
  brand: { color: '#4f46e5', fontFamily: 'Helvetica-Bold', fontSize: 16 },
  eyebrow: { color: '#64748b', fontSize: 8, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#0f172a', fontFamily: 'Helvetica-Bold', fontSize: 22, lineHeight: 1.2 },
  subtitle: { color: '#475569', fontSize: 10, marginTop: 7 },
  section: { marginTop: 18 },
  sectionTitle: { color: '#312e81', fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderColor: '#dbe3f0', borderRadius: 6, borderWidth: 1, padding: 12 },
  verdict: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe', borderRadius: 7, borderWidth: 1, padding: 14 },
  decision: { color: '#3730a3', fontFamily: 'Helvetica-Bold', fontSize: 15 },
  score: { color: '#3730a3', fontFamily: 'Helvetica-Bold', fontSize: 22 },
  label: { color: '#64748b', fontSize: 7.5, letterSpacing: 0.7, textTransform: 'uppercase' },
  body: { color: '#334155', marginTop: 4 },
  muted: { color: '#64748b' },
  row: { flexDirection: 'row' },
  half: { flexBasis: 0, flexGrow: 1 },
  bulletRow: { flexDirection: 'row', marginBottom: 5 },
  bullet: { color: '#4f46e5', marginRight: 6 },
  risk: { borderBottomColor: '#e2e8f0', borderBottomWidth: 1, marginBottom: 7, paddingBottom: 7 },
  agent: { borderColor: '#dbe3f0', borderRadius: 6, borderWidth: 1, marginBottom: 9, padding: 10 },
  agentHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  agentName: { color: '#0f172a', fontFamily: 'Helvetica-Bold', fontSize: 10 },
  tag: { backgroundColor: '#eef2ff', borderRadius: 8, color: '#4338ca', fontSize: 7.5, paddingHorizontal: 6, paddingVertical: 3 },
  footer: { bottom: 22, color: '#94a3b8', fontSize: 7.5, left: 46, position: 'absolute', right: 46, textAlign: 'center' },
  notice: { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderRadius: 6, borderWidth: 1, color: '#92400e', marginTop: 15, padding: 9 },
});

function Header() {
  return <View fixed style={styles.header}><Text style={styles.brand}>ContrarIA</Text><Text style={styles.eyebrow}>Reporte de debate</Text></View>;
}

function Footer() {
  return <Text fixed style={styles.footer} render={({ pageNumber, totalPages }) => `ContrarIA · Página ${pageNumber} de ${totalPages}`} />;
}

function BulletList({ items }) {
  return items.map((item, index) => <View key={`${item}-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.body}>{item}</Text></View>);
}

function Round({ number, positions }) {
  return (
    <Page size="A4" style={styles.page}>
      <Header />
      <Text style={styles.eyebrow}>Detalle de posturas</Text>
      <Text style={styles.title}>Ronda {number}</Text>
      <Text style={styles.subtitle}>{number === 1 ? 'Posturas iniciales del consejo.' : 'Réplicas tras contrastar las posturas de los demás agentes.'}</Text>
      <View style={styles.section}>
        {positions.map((position) => (
          <View key={`${number}-${position.agentId}`} style={styles.agent} wrap={false}>
            <View style={styles.agentHeader}>
              <View><Text style={styles.agentName}>{position.agentName}</Text><Text style={styles.muted}>{position.role}</Text></View>
              <Text style={styles.tag}>{stances[position.stance] || position.stance} · {position.score.toFixed(1)}/10</Text>
            </View>
            <Text style={styles.body}>{position.summary}</Text>
            <View style={{ marginTop: 7 }}>
              {position.arguments.map((argument, index) => <View key={`${position.agentId}-${argument.claim}-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.body}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{argument.claim}: </Text>{argument.reason}</Text></View>)}
            </View>
            {position.changedPosition ? <Text style={[styles.body, { color: '#4338ca' }]}>Cambio de criterio: {position.changeReason || 'La evidencia cruzada modificó su evaluación.'}</Text> : null}
          </View>
        ))}
      </View>
      <Footer />
    </Page>
  );
}

export default function DebateReportDocument({ input, debate, generatedAt }) {
  const { context, verdict, metadata } = debate;
  const formattedDate = generatedAt.toLocaleDateString('es-EC', { dateStyle: 'long' });

  return (
    <Document author="ContrarIA" subject="Reporte de debate de una idea" title="Reporte de debate · ContrarIA" language="es" creationDate={generatedAt}>
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.eyebrow}>Resultado del consejo</Text>
        <Text style={styles.title}>Reporte de evaluación</Text>
        <Text style={styles.subtitle}>Generado el {formattedDate}.</Text>
        <View style={styles.section}><Text style={styles.sectionTitle}>Idea evaluada</Text><View style={styles.card}><Text style={styles.body}>{input.idea}</Text>{input.context ? <Text style={[styles.body, styles.muted]}>Contexto adicional: {input.context}</Text> : null}</View></View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veredicto</Text>
          <View style={styles.verdict}>
            <View style={styles.agentHeader}><View><Text style={styles.decision}>{decisions[verdict.decision] || verdict.decision}</Text><Text style={[styles.body, styles.muted]}>Confianza {confidence[verdict.confidence] || verdict.confidence}</Text></View><View><Text style={styles.label}>Puntuación global</Text><Text style={styles.score}>{verdict.overallScore.toFixed(1)}/10</Text></View></View>
            <Text style={styles.body}>{verdict.rationale}</Text>
          </View>
        </View>
        {verdict.citations?.length ? <View style={styles.section}><Text style={styles.sectionTitle}>Fuentes que informaron el veredicto</Text><View style={styles.card}>{verdict.citations.slice(0, 2).map((citation) => <View key={citation.url} style={styles.bulletRow}><Text style={styles.bullet}>[{citation.id}]</Text><Text style={styles.body}>{citation.title} · {citation.url}</Text></View>)}</View></View> : null}
        <View style={[styles.section, styles.row]}>
          <View style={[styles.half, { marginRight: 6 }]}><Text style={styles.sectionTitle}>Caso a favor</Text><View style={styles.card}><BulletList items={verdict.pros} /></View></View>
          <View style={[styles.half, { marginLeft: 6 }]}><Text style={styles.sectionTitle}>Aspectos críticos</Text><View style={styles.card}><BulletList items={verdict.cons} /></View></View>
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Riesgos priorizados</Text><View style={styles.card}>{verdict.prioritizedRisks.map((risk, index) => <View key={`${risk.risk}-${index}`} style={styles.risk}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{index + 1}. {risk.risk}</Text><Text style={styles.body}>Probabilidad {risk.probability}/5 · Impacto {risk.impact}/5 · Mitigación: {risk.mitigation}</Text></View>)}</View></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Experimento de 48 horas</Text><View style={styles.card}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{verdict.experiment.hypothesis}</Text><Text style={styles.body}>{verdict.experiment.action}</Text><Text style={[styles.body, styles.muted]}>Señal de éxito: {verdict.experiment.successMetric}</Text></View></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Contexto estructurado</Text><View style={styles.card}><Text style={styles.body}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Problema: </Text>{context.problem}</Text><Text style={styles.body}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Usuarios: </Text>{context.targetUsers}</Text><Text style={styles.body}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Propuesta de valor: </Text>{context.valueProposition}</Text></View></View>
        {metadata.partial ? <Text style={styles.notice}>Nota: una o más posturas se completaron con una respuesta de respaldo por disponibilidad o tiempo del proveedor.</Text> : null}
        <Footer />
      </Page>
      <Round number={1} positions={debate.round1} />
      <Round number={2} positions={debate.round2} />
    </Document>
  );
}
