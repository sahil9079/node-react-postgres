const request = require("supertest");

jest.mock("../../models", () => ({
    sampledb: {
        authenticate: jest.fn(),
    },
    User: {},
    Role: {},
    Skill: {},
    LocationOption: {},
}));

const { sampledb } = require("../../models");
const app = require("../../app");

describe("Operational Health & Readiness Probes (/healthz & /readyz)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /healthz (Liveness Probe)", () => {
        test("should return 200 OK with service status and uptime without querying the database", async () => {
            const res = await request(app).get("/healthz");

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe("ok");
            expect(res.body.service).toBe("apiserver");
            expect(typeof res.body.uptime).toBe("number");
            expect(sampledb.authenticate).not.toHaveBeenCalled();
        });
    });

    describe("GET /readyz (Readiness Probe)", () => {
        test("should return 200 OK when PostgreSQL database connection is healthy", async () => {
            sampledb.authenticate.mockResolvedValueOnce();

            const res = await request(app).get("/readyz");

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe("ready");
            expect(res.body.database).toBe("connected");
            expect(sampledb.authenticate).toHaveBeenCalledTimes(1);
        });

        test("should return 503 Service Unavailable when PostgreSQL database connection fails", async () => {
            sampledb.authenticate.mockRejectedValueOnce(new Error("connect ECONNREFUSED 127.0.0.1:5432"));

            const res = await request(app).get("/readyz");

            expect(res.statusCode).toBe(503);
            expect(res.body.status).toBe("not_ready");
            expect(res.body.database).toBe("disconnected");
            expect(res.body.message).toContain("ECONNREFUSED");
        });
    });
});
