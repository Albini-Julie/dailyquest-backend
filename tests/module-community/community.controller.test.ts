import { Request, Response } from "express";
import {
  getSubmittedQuests as getSubmittedQuestsController,
  validateCommunityQuest as validateCommunityQuestController,
} from "../../src/modules/module-community/communityController";
import * as communityService from "../../src/modules/module-community/communityService";
import { UserModel } from "../../src/modules/module-user/userModel";

jest.mock("../../src/modules/module-user/userModel");

const mockRes = (): Response =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any);

const mockUserId = "user-id-123";
const questId = "quest-id-456";

describe("communityController", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("getSubmittedQuests → success", async () => {
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ dailyValidations: 3 }),
    });

    jest
      .spyOn(communityService, "getSubmittedQuests")
      .mockResolvedValue([
        {
          _id: "1",
          status: "submitted",
          proofImage: null,
          toObject: () => ({
            _id: "1",
            status: "submitted",
            proofImage: null,
          }),
        } as any,
      ]);

    const req = { user: { _id: mockUserId } } as Request;
    const res = mockRes();

    await getSubmittedQuestsController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      quests: [
        {
          _id: "1",
          status: "submitted",
          proofImage: null,
          imageUrl: null,
        },
      ],
      dailyValidations: 3,
      dailyLimit: 10,
    });
  });

  it("validateCommunityQuest → error", async () => {
    jest
      .spyOn(communityService, "validateCommunityQuest")
      .mockRejectedValue(new Error("Validation error"));

    const req = {
      user: { _id: mockUserId },
      params: { id: questId },
    } as Request;

    const res = mockRes();

    await validateCommunityQuestController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
