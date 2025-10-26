import 'dotenv/config';
import { getDuePosts, getVideo, updateStatus } from '@/lib/db';
import { publishVideoToInstagram } from '@/lib/instagram';

async function runOnce() {
  const due = await getDuePosts(new Date());
  for (const post of due) {
    try {
      const video = await getVideo(post.id);
      if (!video) {
        await updateStatus({ id: post.id, status: 'failed', error: 'Video missing' });
        continue;
      }
      await publishVideoToInstagram({ caption: post.caption, video });
      await updateStatus({ id: post.id, status: 'sent', error: null });
      console.log(`Published ${post.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await updateStatus({ id: post.id, status: 'failed', error: message });
      console.error(`Failed ${post.id}: ${message}`);
    }
  }
}

async function main() {
  console.log('Running scheduler tick...');
  await runOnce();
  console.log('Done');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
