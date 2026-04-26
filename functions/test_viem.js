async function test() {
  try {
    const viem = await new Function("return import('viem')")();
    console.log("Success!", Object.keys(viem).length);
  } catch(e) {
    console.error("Failed:", e);
  }
}
test();
