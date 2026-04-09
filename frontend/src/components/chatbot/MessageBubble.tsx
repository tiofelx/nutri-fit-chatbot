import React from 'react';
import type { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Visual Cards ─────────────────────────────────────────────────────────────

interface IMCData { value: number; label: string }
interface MacroData { protein: string; carbs: string; fat: string; calories: string }

function extractIMC(text: string): IMCData | null {
  const match = text.match(/IMC[^0-9]*([0-9]+[.,][0-9]+)/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(',', '.'));
  if (isNaN(value) || value < 10 || value > 60) return null;
  let label = 'Peso normal';
  let color = 'text-green-400';
  if (value < 18.5) { label = 'Abaixo do peso'; color = 'text-blue-400'; }
  else if (value < 25) { label = 'Peso normal'; color = 'text-green-400'; }
  else if (value < 30) { label = 'Sobrepeso'; color = 'text-yellow-400'; }
  else { label = 'Obesidade'; color = 'text-red-400'; }
  return { value, label: `${label} — ${color}` };
}

function IMCCard({ text }: { text: string }) {
  const data = extractIMC(text);
  if (!data) return null;
  const value = data.value;
  let label = 'Peso normal'; let colorClass = 'text-green-400'; let barColor = '#4ade80';
  if (value < 18.5) { label = 'Abaixo do peso'; colorClass = 'text-blue-400'; barColor = '#60a5fa'; }
  else if (value < 25) { label = 'Peso normal'; colorClass = 'text-green-400'; barColor = '#4ade80'; }
  else if (value < 30) { label = 'Sobrepeso'; colorClass = 'text-yellow-400'; barColor = '#facc15'; }
  else { label = 'Obesidade'; colorClass = 'text-red-400'; barColor = '#f87171'; }
  const pct = Math.min(100, Math.max(0, ((value - 10) / 40) * 100));

  return (
    <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-base">⚖️</span>
        <span className="text-xs font-semibold text-gray-900">Índice de Massa Corporal</span>
      </div>
      <div className="flex items-end gap-2 mb-1.5">
        <span className={`text-2xl font-bold ${colorClass}`}>{value.toFixed(1)}</span>
        <span className={`text-xs mb-0.5 ${colorClass}`}>{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
        <span>Baixo</span><span>Normal</span><span>Sobrepeso</span><span>Obeso</span>
      </div>
    </div>
  );
}

function extractMacros(text: string): MacroData | null {
  const cal = text.match(/(\d{3,4})\s*kcal/i);
  const prot = text.match(/prote[íi]na[s]?[^0-9]*(\d+)\s*g/i);
  const carb = text.match(/carboidrato[s]?[^0-9]*(\d+)\s*g/i);
  const fat = text.match(/gordura[s]?[^0-9]*(\d+)\s*g/i);
  if (!cal && !prot) return null;
  return {
    calories: cal ? cal[1] : '—',
    protein: prot ? prot[1] + 'g' : '—',
    carbs: carb ? carb[1] + 'g' : '—',
    fat: fat ? fat[1] + 'g' : '—',
  };
}

function MacroCard({ text }: { text: string }) {
  const data = extractMacros(text);
  if (!data) return null;
  const items = [
    { icon: '🔥', label: 'Calorias', value: data.calories + (data.calories !== '—' ? ' kcal' : ''), color: 'text-orange-400' },
    { icon: '💪', label: 'Proteína', value: data.protein, color: 'text-blue-400' },
    { icon: '🌾', label: 'Carboidratos', value: data.carbs, color: 'text-yellow-400' },
    { icon: '🥑', label: 'Gorduras', value: data.fat, color: 'text-green-400' },
  ];
  return (
    <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">🥗</span>
        <span className="text-xs font-semibold text-gray-900">Resumo Nutricional</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map(item => (
          <div key={item.label} className="bg-white rounded-lg px-2 py-1.5 border border-gray-100">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs">{item.icon}</span>
              <span className="text-[10px] text-gray-600">{item.label}</span>
            </div>
            <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function hasWorkoutPlan(text: string): boolean {
  return /plano de treino|exerc[íi]cio[s]?|s[eé]rie[s]?.*repeti[çc][ãa]o|treino.*semana/i.test(text)
    && text.length > 200;
}

function WorkoutBadge() {
  return (
    <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 flex items-center gap-2">
      <span className="text-lg">🏋️</span>
      <div>
        <p className="text-xs font-semibold text-gray-900">Plano de Treino</p>
        <p className="text-[10px] text-gray-600">Personalizado para seus objetivos</p>
      </div>
      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
        style={{ background: 'linear-gradient(135deg,#00d4aa,#7c3aed)', color: '#fff' }}>
        Ativo
      </span>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-black/30 rounded px-1 text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1 ? 'text-base font-bold mt-2 mb-1' : 'text-sm font-semibold mt-1.5 mb-0.5';
      nodes.push(<p key={i} className={cls}>{renderInline(headingMatch[2])}</p>);
      i++; continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
        items.push(<li key={i} className="ml-3 list-disc list-inside leading-snug">{renderInline(lines[i].replace(/^[-*•]\s+/, ''))}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="my-1 space-y-0.5">{items}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(<li key={i} className="ml-3 list-decimal list-inside leading-snug">{renderInline(lines[i].replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="my-1 space-y-0.5">{items}</ol>);
      continue;
    }
    if (line.trim() === '') { nodes.push(<div key={i} className="h-1.5" />); i++; continue; }
    nodes.push(<p key={i} className="leading-snug">{renderInline(line)}</p>);
    i++;
  }
  return nodes;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const showCards = !isUser && !message.isStreaming && message.content.length > 50;

  return (
    <div className={`flex w-full mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 text-xs sm:text-sm
          ${isUser ? 'rounded-tr-sm text-white' : 'rounded-tl-sm bg-gray-100 text-gray-800 border border-gray-200'}
        `}
        style={isUser ? { background: 'linear-gradient(135deg, #00d4aa, #7c3aed)' } : undefined}
      >
        <div className="space-y-0.5">
          {renderMarkdown(message.content)}
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-white ml-0.5 align-middle animate-pulse" />
          )}
        </div>

        {/* Visual summary cards */}
        {showCards && <IMCCard text={message.content} />}
        {showCards && <MacroCard text={message.content} />}
        {showCards && hasWorkoutPlan(message.content) && <WorkoutBadge />}

        <p className={`text-[10px] mt-1 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp))}
        </p>
      </div>
    </div>
  );
};
