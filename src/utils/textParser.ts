/**
 * Formats biblical dictionary article text into structured parts
 * and extracts matching title cross-links.
 */

export interface ParsedSection {
  type: 'header' | 'title_def' | 'verse' | 'paragraph' | 'bullet';
  label?: string;
  content: string;
}

export function parseMeaningText(text: string): ParsedSection[] {
  if (!text) return [];

  const lines = text.split('\n');
  const sections: ParsedSection[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('* မူရင်း') || line.startsWith('* ဟေဗြဲ') || line.startsWith('* ဂရိ') || line.startsWith('* အာရမေအစ်')) {
      sections.push({
        type: 'title_def',
        content: line.replace(/^\*\s*/, '')
      });
    } else if (line.startsWith('* အဓိပ္ပာယ်ရှင်းလင်းချက်:')) {
      sections.push({
        type: 'header',
        label: 'အဓိပ္ပာယ် ရှင်းလင်းချက်',
        content: line.replace('* အဓိပ္ပာယ်ရှင်းလင်းချက်:', '').trim()
      });
    } else if (line.startsWith('* ကျမ်းစာကိုးကား:')) {
      sections.push({
        type: 'header',
        label: 'ကျမ်းစာကိုးကားချက်များ',
        content: line.replace('* ကျမ်းစာကိုးကား:', '').trim()
      });
    } else if (line.startsWith('* ကျမ်းစာသုံး သဘောတရားနှင့် အကြောင်းအရာ') || line.startsWith('* သဘောတရား:')) {
      sections.push({
        type: 'header',
        label: 'ဓမ္မသဘောတရားနှင့် သမိုင်းနောက်ခံ',
        content: line.replace(/^\*\s*[^:]+:\s*/, '').trim()
      });
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      sections.push({
        type: 'bullet',
        content: line.replace(/^[\*\-]\s*/, '')
      });
    } else {
      sections.push({
        type: 'paragraph',
        content: line
      });
    }
  }

  return sections;
}
