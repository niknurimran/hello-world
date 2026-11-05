import React from 'react';
import { C, FONT, W } from '../lib/theme';
import { lineAt, wordsOfLine, WordsFile } from '../lib/timing';

/** One spoken line at a time: spoken = dark, upcoming = grey, current word underlined orange. */
export const Caption: React.FC<{ data: WordsFile; time: number }> = ({ data, time }) => {
  const li = lineAt(data, time);
  const words = wordsOfLine(data, li);
  return (
    <div style={{ position: 'absolute', left: 0, width: W, top: 1330, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          transform: 'translateY(-50%)',
          maxWidth: 900,
          background: '#fff',
          borderRadius: 18,
          padding: '16px 30px 20px',
          boxShadow: '0 10px 30px rgba(20,22,26,0.18), 0 2px 0 rgba(20,22,26,0.06)',
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.22,
          letterSpacing: -0.5,
          textAlign: 'center',
        }}
      >
        {words.map((w, i) => {
          const spoken = time >= w.start;
          const isCurrent = spoken && time < (words[i + 1]?.start ?? w.end + 0.25);
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  color: spoken ? C.ink : C.grey,
                  textDecoration: isCurrent ? 'underline' : 'none',
                  textDecorationColor: C.orange,
                  textDecorationThickness: 6,
                  textUnderlineOffset: 10,
                }}
              >
                {w.text}
              </span>
              {i < words.length - 1 ? ' ' : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
