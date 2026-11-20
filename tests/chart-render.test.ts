import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement, type ComponentType, type ReactNode } from 'react';
// Recharts 2 publishes legacy class defaultProps types; keep the runtime components intact.
const h = (type: unknown, props: Record<string, unknown>, ...children: ReactNode[]) => createElement(type as ComponentType<Record<string, unknown>>, props, ...children);
import { renderToStaticMarkup } from 'react-dom/server';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis } from 'recharts';

test('installed chart dependencies recognise React elements and render real axes and plotted marks', () => {
 const rows = [{ label: 'First', value: 84 }, { label: 'Second', value: 112 }];
 for (const [Chart, Mark, shape] of [[AreaChart, Area, 'recharts-area-area'], [BarChart, Bar, 'recharts-bar-rectangle']] as const) {
  const svg = renderToStaticMarkup(h(Chart, { width: 640, height: 245, data: rows },
   h(XAxis, { dataKey: 'label' }), h(YAxis, {}), h(Mark, { dataKey: 'value', isAnimationActive: false })));
  assert.match(svg, /First/);
  assert.match(svg, /Second/);
  assert.ok(svg.includes(shape), `Missing ${shape}`);
 }
});
