import type { Block, KnownBlock } from '@slack/types';
import type { SummaryResults } from 'playwright-slack-report/dist/src';

function statusSymbol(
  status: 'passed' | 'failed' | 'skipped' | 'timedOut',
): string {
  switch (status) {
    case 'passed':
      return '✓';
    case 'failed':
      return '❌';
    case 'skipped':
      return '⚠️';
    case 'timedOut':
      return '⏱❌';
    default:
      return '';
  }
}

function formatDuration(startedAt: string, endedAt: string): string {
  try {
    const diff = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    return Number.isNaN(diff) ? '' : ` (${diff}ms)`;
  } catch {
    return '';
  }
}

export function upsWooSlackLayout(
  summaryResults: SummaryResults,
): Array<Block | KnownBlock> {
  const blocks: Array<Block | KnownBlock> = [];

  const executedTests = summaryResults.tests.filter(
    test => !['skipped', 'interrupted'].includes(test.status),
  ).length;

  const summaryText = `@here *Automation Test Report*

*SUMMARY:*
✅ ${summaryResults.passed} passed | ❌ ${summaryResults.failed} failed | ⚠️ ${summaryResults.skipped} skipped | *Total:* ${executedTests}

>*App URL:* ${process.env.site_url || 'Not provided'}
>*Project:* UPS Woo Automation
>*Triggered By:* ${process.env.GITHUB_ACTOR || process.env.USER || 'Local run'}`;

  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: summaryText },
  });

  let currentChunk: string[] = [];
  let lastSuite: string | undefined;

  summaryResults.tests
    .filter(test => test.status !== 'skipped')
    .forEach((test, index) => {
      const suite = test.suiteName || '(no suite)';
      const title = test.name || '(no title)';

      if (suite !== lastSuite && currentChunk.length) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\`\`\`${currentChunk.join('\n')}\`\`\``,
          },
        });
        currentChunk = [];
      }

      if (suite !== lastSuite) {
        currentChunk.push(`${suite}:`);
        lastSuite = suite;
      }

      currentChunk.push(
        `${index + 1}. ${statusSymbol(test.status)} ${title}${formatDuration(
          test.startedAt,
          test.endedAt,
        )}`,
      );
    });

  if (currentChunk.length) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\`\`\`${currentChunk.join('\n')}\`\`\``,
      },
    });
  }

  return blocks;
}
