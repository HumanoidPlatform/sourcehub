// Which server a build talks to is decided by its EAS channel, compiled into
// the binary. A wrong mapping here sends the prod app to dev, or a tester to
// prod, on the next over-the-air update.

const PROD = "https://datamind360.product.cosarathi.ai";
const DEV = "https://datamind360.product-dev.cosarathi.ai";

function urlFor(channel: string | null): string {
  let url = "";
  jest.isolateModules(() => {
    jest.doMock("expo-updates", () => ({ channel }));
    url = require("../src/config").PRODUCTION_API_URL;
  });
  return url;
}

describe("the server a build talks to", () => {
  it.each(["staging", "production"])("is prod on %p", (channel) => {
    expect(urlFor(channel)).toBe(PROD);
  });

  it.each(["preview", "dev", "development", "video", null])("is dev on %p", (channel) => {
    expect(urlFor(channel)).toBe(DEV);
  });
});
