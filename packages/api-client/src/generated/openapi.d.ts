// Generated from the local Market Data Service OpenAPI schema. Do not edit manually.

export interface paths {
    "/healthz": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Healthz */
        get: operations["healthz_healthz_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/readyz": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Readyz */
        get: operations["readyz_readyz_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bars/{symbol}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Bars */
        get: operations["get_bars_v1_bars__symbol__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/quotes/{symbol}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Quote */
        get: operations["get_quote_v1_quotes__symbol__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** BarResponse */
        BarResponse: {
            /** Close */
            close: number;
            /** High */
            high: number;
            /** Low */
            low: number;
            /** Open */
            open: number;
            /** Source */
            source: string;
            /** Symbol */
            symbol: string;
            timeframe: components["schemas"]["BarTimeframe"];
            /**
             * Timestamp
             * Format: date-time
             */
            timestamp: string;
            /** Volume */
            volume: number;
        };
        /**
         * BarTimeframe
         * @enum {string}
         */
        BarTimeframe: "1d" | "1m";
        /** BarsResponse */
        BarsResponse: {
            /** Bars */
            bars: components["schemas"]["BarResponse"][];
            /** Symbol */
            symbol: string;
            timeframe: components["schemas"]["BarTimeframe"];
        };
        /**
         * Freshness
         * @enum {string}
         */
        Freshness: "current" | "stale" | "unknown";
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** HealthResponse */
        HealthResponse: {
            /** Collectorconfigured */
            collectorConfigured: boolean;
            /** Livedataconfigured */
            liveDataConfigured: boolean;
            /**
             * Status
             * @constant
             */
            status: "ok";
        };
        /** QuoteResponse */
        QuoteResponse: {
            freshness: components["schemas"]["Freshness"];
            /** Price */
            price: number;
            /** Source */
            source: string;
            status: components["schemas"]["QuoteStatus"];
            /** Symbol */
            symbol: string;
            /**
             * Timestamp
             * Format: date-time
             */
            timestamp: string;
        };
        /**
         * QuoteStatus
         * @enum {string}
         */
        QuoteStatus: "live" | "delayed";
        /** ReadyResponse */
        ReadyResponse: {
            /**
             * Collector
             * @enum {string}
             */
            collector: "disabled" | "configured" | "healthy" | "stale";
            /**
             * Redis
             * @enum {string}
             */
            redis: "disabled" | "ok" | "unavailable";
            /**
             * Status
             * @enum {string}
             */
            status: "ready" | "not_ready";
        };
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    healthz_healthz_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    readyz_readyz_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadyResponse"];
                };
            };
        };
    };
    get_bars_v1_bars__symbol__get: {
        parameters: {
            query: {
                start: string;
                end: string;
                timeframe?: components["schemas"]["BarTimeframe"];
            };
            header?: never;
            path: {
                symbol: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BarsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_quote_v1_quotes__symbol__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                symbol: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QuoteResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Redis live quote store is unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
