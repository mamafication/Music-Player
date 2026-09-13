import YTMusic from 'ytmusic-api';
async function run() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const res = await ytmusic.searchSongs("hello");
  console.log(JSON.stringify(res[0], null, 2));
}
run();
