import { getStats } from "../../src/modules/module-user/userController";
import { UserModel } from "../../src/modules/module-user/userModel";
import { Response } from "express";

jest.mock("../../src/modules/module-user/userModel");

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("userController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns user stats", async () => {
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ username: "Julie" }),
    });

    const req = { user: { id: "1" } } as any;
    const res = mockRes();

    await getStats(req, res as Response);

    expect(res.json).toHaveBeenCalled();
  });

  it("returns 404 if user not found", async () => {
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = { user: { id: "1" } } as any;
    const res = mockRes();

    await getStats(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 500 on error", async () => {
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = { user: { id: "1" } } as any;
    const res = mockRes();

    await getStats(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
