const request = require("supertest");
const Sequelize = require("sequelize");
const { JsonWebTokenError, TokenExpiredError, NotBeforeError } = require("jsonwebtoken");

jest.mock("../../models", () => ({
    sampledb: {
        authenticate: jest.fn(),
    },
    User: {
        findByPk: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
    },
    Role: {},
    Skill: {
        findByPk: jest.fn(),
    },
    LocationOption: {
        findAll: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
    },
}));

const { sampledb, User, Skill } = require("../../models");
const app = require("../../app");
const AppError = require("../../utils/appError");
const authorizeOnly = require("../../middleware/athorizeOnly");
const convertErrors = require("../../middleware/convertErrors");
const handleErrors = require("../../middleware/handleErrors");
const authController = require("../../controllers/authController");
const skillController = require("../../controllers/skillController");
const userController = require("../../controllers/userController");
const authService = require("../../services/authService");

describe("Operational Health, Readiness, Metrics & Middleware Verification", () => {
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

    describe("GET /metrics (Prometheus Telemetry Endpoint)", () => {
        test("should expose Prometheus 0.0.4 text format with process and HTTP request metrics", async () => {
            await request(app).get("/healthz");
            const res = await request(app).get("/metrics");

            expect(res.statusCode).toBe(200);
            expect(res.headers["content-type"]).toContain("text/plain");
            expect(res.text).toContain("process_resident_memory_bytes");
            expect(res.text).toContain("http_requests_total");
            expect(res.text).toContain("http_request_duration_seconds_bucket");
        });
    });

    describe("RBAC, Error Middleware & Controller Branch Checks", () => {
        test("authorizeOnly allows permitted roles and rejects unauthorized roles with 403", () => {
            const mw = authorizeOnly("admin", "manager");
            const nextOk = jest.fn();
            mw({ role: "admin" }, {}, nextOk);
            expect(nextOk).toHaveBeenCalledWith();

            const nextForbidden = jest.fn();
            mw({ role: "guest" }, {}, nextForbidden);
            expect(nextForbidden).toHaveBeenCalledWith(expect.any(AppError));
        });

        test("convertErrors converts JWT and Sequelize errors into AppError instances", () => {
            const nextJwt = jest.fn();
            convertErrors(new JsonWebTokenError("bad token"), {}, {}, nextJwt);
            expect(nextJwt.mock.calls[0][0]).toBeInstanceOf(AppError);

            const nextExp = jest.fn();
            convertErrors(new TokenExpiredError("expired", new Date()), {}, {}, nextExp);
            expect(nextExp.mock.calls[0][0]).toBeInstanceOf(AppError);

            const nextNbf = jest.fn();
            convertErrors(new NotBeforeError("not active", new Date()), {}, {}, nextNbf);
            expect(nextNbf.mock.calls[0][0]).toBeInstanceOf(AppError);

            const seqValErr = new Sequelize.ValidationError("val", [{ message: "field required" }]);
            const nextSeqVal = jest.fn();
            convertErrors(seqValErr, {}, {}, nextSeqVal);
            expect(nextSeqVal.mock.calls[0][0].message).toContain("Invalid input:");

            const seqUniqErr = new Sequelize.UniqueConstraintError({ errors: [{ message: "email taken" }] });
            const nextSeqUniq = jest.fn();
            convertErrors(seqUniqErr, {}, {}, nextSeqUniq);
            expect(nextSeqUniq.mock.calls[0][0].message).toContain("Unique key violation:");

            const genericErr = new Error("");
            const nextGeneric = jest.fn();
            convertErrors(genericErr, {}, {}, nextGeneric);
            expect(nextGeneric.mock.calls[0][0].statusCode).toBe(500);
        });

        test("handleErrors handles dev and production error branches cleanly", () => {
            const prevEnv = process.env.NODE_ENV;

            process.env.NODE_ENV = "development";
            const resDevHeadersSent = { headersSent: true, clearCookie: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
            handleErrors(new AppError(401, "Unauthorized", true), {}, resDevHeadersSent, jest.fn());
            expect(resDevHeadersSent.clearCookie).toHaveBeenCalled();
            expect(resDevHeadersSent.status).not.toHaveBeenCalled();

            process.env.NODE_ENV = "production";
            const resProdOp = { headersSent: false, clearCookie: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
            handleErrors(new AppError(400, "Operational error", true), {}, resProdOp, jest.fn());
            expect(resProdOp.status).toHaveBeenCalledWith(400);

            const resProdOpSent = { headersSent: true, clearCookie: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
            handleErrors(new AppError(400, "Operational error", true), {}, resProdOpSent, jest.fn());
            expect(resProdOpSent.status).not.toHaveBeenCalled();

            const resUnknown = { headersSent: false, clearCookie: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
            handleErrors(new AppError(500, "Internal crash", false), {}, resUnknown, jest.fn());
            expect(resUnknown.status).toHaveBeenCalledWith(500);

            const resUnknownSent = { headersSent: true, clearCookie: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
            handleErrors(new AppError(500, "Internal crash", false), {}, resUnknownSent, jest.fn());
            expect(resUnknownSent.status).not.toHaveBeenCalled();

            process.env.NODE_ENV = prevEnv;
        });

        test("authController.verify sets cookie when session exists and redirects", async () => {
            jest.spyOn(authService, "verifyUser").mockResolvedValueOnce({
                session: "encrypted-session",
                config: { httpOnly: true },
            });
            const req = { params: { token: "tok" } };
            const res = { cookie: jest.fn().mockReturnThis(), redirect: jest.fn() };
            await authController.verify(req, res, jest.fn());
            expect(res.cookie).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalled();

            jest.spyOn(authService, "verifyUser").mockResolvedValueOnce({
                session: null,
                config: null,
            });
            const resNoSession = { cookie: jest.fn().mockReturnThis(), redirect: jest.fn() };
            await authController.verify(req, resNoSession, jest.fn());
            expect(resNoSession.cookie).not.toHaveBeenCalled();
            expect(resNoSession.redirect).toHaveBeenCalled();
        });

        test("skillController.updateSkillById validates ownership, travelFee, and empty locationOptions", async () => {
            Skill.findByPk.mockResolvedValueOnce({ id: 1, userId: 99 });
            const nextNotOwner = jest.fn();
            await skillController.updateSkillById(
                { userId: 1, params: { skillId: 1 }, body: { category: "DevOps", tagLine: "K8s", travelFee: 0, locationOptions: [] } },
                {},
                nextNotOwner
            );
            expect(nextNotOwner).toHaveBeenCalledWith(expect.any(AppError));

            Skill.findByPk.mockResolvedValueOnce({ id: 1, userId: 1 });
            const nextBadFee = jest.fn();
            await skillController.updateSkillById(
                { userId: 1, params: { skillId: 1 }, body: { category: "DevOps", tagLine: "K8s", travelFee: 25, locationOptions: ["online"] } },
                {},
                nextBadFee
            );
            expect(nextBadFee).toHaveBeenCalledWith(expect.any(AppError));

            const mockSave = jest.fn().mockResolvedValueOnce();
            Skill.findByPk.mockResolvedValueOnce({ id: 1, userId: 1, save: mockSave });
            const resOk = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            skillController.updateSkillById(
                { userId: 1, params: { skillId: 1 }, body: { category: "DevOps", tagLine: "K8s", travelFee: 0, locationOptions: [] } },
                resOk,
                jest.fn()
            );
            await new Promise((resolve) => setImmediate(resolve));
            expect(mockSave).toHaveBeenCalled();
            expect(resOk.status).toHaveBeenCalledWith(200);
        });

        test("userController.updateUserPassword and updateUserProfile validate inputs", async () => {
            const nextMissingOld = jest.fn();
            userController.updateUserPassword(
                { userId: 1, body: { oldPassword: "", password: "new", passwordConfirm: "new" } },
                {},
                nextMissingOld
            );
            await new Promise((resolve) => setImmediate(resolve));
            expect(nextMissingOld).toHaveBeenCalledWith(expect.any(AppError));

            User.update.mockResolvedValueOnce([1, { id: 1, firstName: "Sahil" }]);
            const resProfile = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            userController.updateUserProfile(
                { userId: 1, body: { firstName: "Sahil", lastName: "DevOps" } },
                resProfile,
                jest.fn()
            );
            await new Promise((resolve) => setImmediate(resolve));
            expect(resProfile.status).toHaveBeenCalledWith(200);
        });
    });
});

