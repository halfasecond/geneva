import { Plugin } from 'vitest/config';
import { CDPSession, BrowserServerState as BrowserServerState$1, BrowserServerStateContext, BrowserServer as BrowserServer$1, WorkspaceProject, Vite, BrowserProvider, BrowserScript, Vitest, ProcessPool } from 'vitest/node';
import * as vitest from 'vitest';
import { RunnerTestFile, TaskResultPack, AfterSuiteRunMeta, CancelReason, UserConsoleLog, SnapshotResult, SerializedConfig, ErrorWithDiff } from 'vitest';
import { HtmlTagDescriptor } from 'vite';
import { StackTraceParserOptions } from '@vitest/utils/source-map';
import { ServerIdResolution, ServerMockResolution } from '@vitest/mocker/node';

type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never;
type ReturnType<T> = T extends (...args: any) => infer R ? R : never;
type PromisifyFn<T> = ReturnType<T> extends Promise<any> ? T : (...args: ArgumentsType<T>) => Promise<Awaited<ReturnType<T>>>;
type BirpcFn<T> = PromisifyFn<T> & {
    /**
     * Send event without asking for response
     */
    asEvent: (...args: ArgumentsType<T>) => void;
};
type BirpcReturn<RemoteFunctions, LocalFunctions = Record<string, never>> = {
    [K in keyof RemoteFunctions]: BirpcFn<RemoteFunctions[K]>;
} & {
    $functions: LocalFunctions;
    $close: () => void;
};

interface WebSocketBrowserHandlers {
    resolveSnapshotPath: (testPath: string) => string;
    resolveSnapshotRawPath: (testPath: string, rawPath: string) => string;
    onUnhandledError: (error: unknown, type: string) => Promise<void>;
    onCollected: (files?: RunnerTestFile[]) => Promise<void>;
    onTaskUpdate: (packs: TaskResultPack[]) => void;
    onAfterSuiteRun: (meta: AfterSuiteRunMeta) => void;
    onCancel: (reason: CancelReason) => void;
    getCountOfFailedTests: () => number;
    readSnapshotFile: (id: string) => Promise<string | null>;
    saveSnapshotFile: (id: string, content: string) => Promise<void>;
    removeSnapshotFile: (id: string) => Promise<void>;
    sendLog: (log: UserConsoleLog) => void;
    finishBrowserTests: (contextId: string) => void;
    snapshotSaved: (snapshot: SnapshotResult) => void;
    debug: (...args: string[]) => void;
    resolveId: (id: string, importer?: string) => Promise<ServerIdResolution | null>;
    triggerCommand: <T>(contextId: string, command: string, testPath: string | undefined, payload: unknown[]) => Promise<T>;
    resolveMock: (id: string, importer: string, options: {
        mock: 'spy' | 'factory' | 'auto';
    }) => Promise<ServerMockResolution>;
    invalidate: (ids: string[]) => void;
    getBrowserFileSourceMap: (id: string) => SourceMap | null | {
        mappings: '';
    } | undefined;
    sendCdpEvent: (contextId: string, event: string, payload?: Record<string, unknown>) => unknown;
    trackCdpEvent: (contextId: string, type: 'on' | 'once' | 'off', event: string, listenerId: string) => void;
}
interface WebSocketBrowserEvents {
    onCancel: (reason: CancelReason) => void;
    createTesters: (files: string[]) => Promise<void>;
    cdpEvent: (event: string, payload: unknown) => void;
}
type WebSocketBrowserRPC = BirpcReturn<WebSocketBrowserEvents, WebSocketBrowserHandlers>;
interface SourceMap {
    file: string;
    mappings: string;
    names: string[];
    sources: string[];
    sourcesContent?: string[];
    version: number;
    toString: () => string;
    toUrl: () => string;
}

declare class BrowserServerCDPHandler {
    private session;
    private tester;
    private listenerIds;
    private listeners;
    constructor(session: CDPSession, tester: WebSocketBrowserRPC);
    send(method: string, params?: Record<string, unknown>): Promise<unknown>;
    on(event: string, id: string, once?: boolean): void;
    off(event: string, id: string): void;
    once(event: string, listener: string): void;
}

declare class BrowserServerState implements BrowserServerState$1 {
    readonly orchestrators: Map<string, WebSocketBrowserRPC>;
    readonly testers: Map<string, WebSocketBrowserRPC>;
    readonly cdps: Map<string, BrowserServerCDPHandler>;
    private contexts;
    getContext(contextId: string): BrowserServerStateContext | undefined;
    createAsyncContext(method: 'run' | 'collect', contextId: string, files: string[]): Promise<void>;
    removeCDPHandler(sessionId: string): Promise<void>;
}

declare class BrowserServer implements BrowserServer$1 {
    project: WorkspaceProject;
    base: string;
    faviconUrl: string;
    prefixTesterUrl: string;
    orchestratorScripts: string | undefined;
    testerScripts: HtmlTagDescriptor[] | undefined;
    manifest: Promise<Vite.Manifest> | Vite.Manifest;
    testerHtml: Promise<string> | string;
    testerFilepath: string;
    orchestratorHtml: Promise<string> | string;
    injectorJs: Promise<string> | string;
    errorCatcherUrl: string;
    locatorsUrl: string | undefined;
    stateJs: Promise<string> | string;
    state: BrowserServerState;
    provider: BrowserProvider;
    vite: Vite.ViteDevServer;
    private stackTraceOptions;
    constructor(project: WorkspaceProject, base: string);
    setServer(server: Vite.ViteDevServer): void;
    getSerializableConfig(): SerializedConfig;
    resolveTesterUrl(pathname: string): {
        contextId: string;
        testFile: string;
    };
    formatScripts(scripts: BrowserScript[] | undefined): Promise<HtmlTagDescriptor[]>;
    initBrowserProvider(): Promise<void>;
    parseErrorStacktrace(e: ErrorWithDiff, options?: StackTraceParserOptions): vitest.ParsedStack[];
    parseStacktrace(trace: string, options?: StackTraceParserOptions): vitest.ParsedStack[];
    private cdpSessionsPromises;
    ensureCDPHandler(contextId: string, sessionId: string): Promise<BrowserServerCDPHandler>;
    close(): Promise<void>;
}

declare const distRoot: string;

declare function createBrowserPool(ctx: Vitest): ProcessPool;

declare function createBrowserServer(project: WorkspaceProject, configFile: string | undefined, prePlugins?: Plugin[], postPlugins?: Plugin[]): Promise<BrowserServer>;

export { BrowserServer, createBrowserPool, createBrowserServer, distRoot };
