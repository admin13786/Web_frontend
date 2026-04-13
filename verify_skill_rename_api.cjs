const base = 'http://127.0.0.1/api/workshop';

async function main() {
  const listResp = await fetch(base + '/skills?page=1&page_size=1');
  const listJson = await listResp.json();
  const items = (listJson && listJson.data && Array.isArray(listJson.data.items)) ? listJson.data.items : [];
  if (!items.length) {
    console.log('no_skill_found');
    process.exit(1);
  }
  const first = items[0];
  const patchResp = await fetch(base + '/skills/' + encodeURIComponent(first.id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name: first.name }),
  });
  const patchJson = await patchResp.json();
  console.log('status', patchResp.status);
  console.log('code', patchJson && patchJson.code);
  console.log('patched_name', (patchJson && patchJson.data && patchJson.data.name) || '');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
