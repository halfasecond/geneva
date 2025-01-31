const playwrightBrowsers = ["firefox", "webkit", "chromium"];
class PlaywrightBrowserProvider {
  name = "playwright";
  supportsParallelism = true;
  browser = null;
  browserName;
  ctx;
  options;
  contexts = /* @__PURE__ */ new Map();
  pages = /* @__PURE__ */ new Map();
  browserPromise = null;
  getSupportedBrowsers() {
    return playwrightBrowsers;
  }
  initialize(project, { browser, options }) {
    this.ctx = project;
    this.browserName = browser;
    this.options = options;
  }
  async openBrowser() {
    if (this.browserPromise) {
      return this.browserPromise;
    }
    if (this.browser) {
      return this.browser;
    }
    this.browserPromise = (async () => {
      const options = this.ctx.config.browser;
      const playwright = await import('playwright');
      const launchOptions = {
        ...this.options?.launch,
        headless: options.headless
      };
      if (this.ctx.config.inspector.enabled) {
        const port = this.ctx.config.inspector.port || 9229;
        const host = this.ctx.config.inspector.host || "127.0.0.1";
        launchOptions.args ||= [];
        launchOptions.args.push(`--remote-debugging-port=${port}`);
        launchOptions.args.push(`--remote-debugging-address=${host}`);
        this.ctx.logger.log(`Debugger listening on ws://${host}:${port}`);
      }
      if (this.ctx.config.browser.ui && this.browserName === "chromium") {
        if (!launchOptions.args) {
          launchOptions.args = [];
        }
        if (!launchOptions.args.includes("--start-maximized") && !launchOptions.args.includes("--start-fullscreen")) {
          launchOptions.args.push("--start-maximized");
        }
      }
      const browser = await playwright[this.browserName].launch(launchOptions);
      this.browser = browser;
      this.browserPromise = null;
      return this.browser;
    })();
    return this.browserPromise;
  }
  async createContext(contextId) {
    if (this.contexts.has(contextId)) {
      return this.contexts.get(contextId);
    }
    const browser = await this.openBrowser();
    const options = {
      ...this.options?.context,
      ignoreHTTPSErrors: true,
      serviceWorkers: "allow"
    };
    if (this.ctx.config.browser.ui) {
      options.viewport = null;
    }
    const context = await browser.newContext(options);
    this.contexts.set(contextId, context);
    return context;
  }
  getPage(contextId) {
    const page = this.pages.get(contextId);
    if (!page) {
      throw new Error(`Page "${contextId}" not found`);
    }
    return page;
  }
  getCommandsContext(contextId) {
    const page = this.getPage(contextId);
    return {
      page,
      context: this.contexts.get(contextId),
      frame() {
        return new Promise((resolve, reject) => {
          const frame = page.frame("vitest-iframe");
          if (frame) {
            return resolve(frame);
          }
          const timeout = setTimeout(() => {
            const err = new Error(`Cannot find "vitest-iframe" on the page. This is a bug in Vitest, please report it.`);
            reject(err);
          }, 1e3);
          page.on("frameattached", (frame2) => {
            clearTimeout(timeout);
            resolve(frame2);
          });
        });
      },
      get iframe() {
        return page.frameLocator('[data-vitest="true"]');
      }
    };
  }
  async openBrowserPage(contextId) {
    if (this.pages.has(contextId)) {
      const page2 = this.pages.get(contextId);
      await page2.close();
      this.pages.delete(contextId);
    }
    const context = await this.createContext(contextId);
    const page = await context.newPage();
    this.pages.set(contextId, page);
    if (process.env.VITEST_PW_DEBUG) {
      page.on("requestfailed", (request) => {
        console.error(
          "[PW Error]",
          request.resourceType(),
          "request failed for",
          request.url(),
          "url:",
          request.failure()?.errorText
        );
      });
    }
    return page;
  }
  async openPage(contextId, url, beforeNavigate) {
    const browserPage = await this.openBrowserPage(contextId);
    await beforeNavigate?.();
    await browserPage.goto(url);
  }
  async getCDPSession(contextId) {
    const page = this.getPage(contextId);
    const cdp = await page.context().newCDPSession(page);
    return {
      async send(method, params) {
        const result = await cdp.send(method, params);
        return result;
      },
      on(event, listener) {
        cdp.on(event, listener);
      },
      off(event, listener) {
        cdp.off(event, listener);
      },
      once(event, listener) {
        cdp.once(event, listener);
      }
    };
  }
  async close() {
    const browser = this.browser;
    this.browser = null;
    await Promise.all([...this.pages.values()].map((p) => p.close()));
    this.pages.clear();
    await Promise.all([...this.contexts.values()].map((c) => c.close()));
    this.contexts.clear();
    await browser?.close();
  }
}

const webdriverBrowsers = ["firefox", "chrome", "edge", "safari"];
class WebdriverBrowserProvider {
  name = "webdriverio";
  supportsParallelism = false;
  browser = null;
  browserName;
  ctx;
  options;
  getSupportedBrowsers() {
    return webdriverBrowsers;
  }
  async initialize(ctx, { browser, options }) {
    this.ctx = ctx;
    this.browserName = browser;
    this.options = options;
  }
  async beforeCommand() {
    const page = this.browser;
    const iframe = await page.findElement(
      "css selector",
      "iframe[data-vitest]"
    );
    await page.switchToFrame(iframe);
  }
  async afterCommand() {
    await this.browser.switchToParentFrame();
  }
  getCommandsContext() {
    return {
      browser: this.browser
    };
  }
  async openBrowser() {
    if (this.browser) {
      return this.browser;
    }
    const options = this.ctx.config.browser;
    if (this.browserName === "safari") {
      if (options.headless) {
        throw new Error(
          "You've enabled headless mode for Safari but it doesn't currently support it."
        );
      }
    }
    const { remote } = await import('webdriverio');
    this.browser = await remote({
      ...this.options,
      logLevel: "error",
      capabilities: this.buildCapabilities()
    });
    return this.browser;
  }
  buildCapabilities() {
    const capabilities = {
      ...this.options?.capabilities,
      browserName: this.browserName
    };
    const headlessMap = {
      chrome: ["goog:chromeOptions", ["headless", "disable-gpu"]],
      firefox: ["moz:firefoxOptions", ["-headless"]],
      edge: ["ms:edgeOptions", ["--headless"]]
    };
    const options = this.ctx.config.browser;
    const browser = this.browserName;
    if (browser !== "safari" && options.headless) {
      const [key, args] = headlessMap[browser];
      const currentValues = this.options?.capabilities?.[key] || {};
      const newArgs = [...currentValues.args || [], ...args];
      capabilities[key] = { ...currentValues, args: newArgs };
    }
    if (options.ui && (browser === "chrome" || browser === "edge")) {
      const key = browser === "chrome" ? "goog:chromeOptions" : "ms:edgeOptions";
      const args = capabilities[key]?.args || [];
      if (!args.includes("--start-maximized") && !args.includes("--start-fullscreen")) {
        args.push("--start-maximized");
      }
      capabilities[key] ??= {};
      capabilities[key].args = args;
    }
    return capabilities;
  }
  async openPage(_contextId, url) {
    const browserInstance = await this.openBrowser();
    await browserInstance.url(url);
  }
  async close() {
    await Promise.all([
      this.browser?.sessionId ? this.browser?.deleteSession?.() : null
    ]);
    process.exit();
  }
}

export { PlaywrightBrowserProvider as P, WebdriverBrowserProvider as W };
