import http from "http";
import { socketService } from "../../src/socket/socketService";
import * as socketModule from "../../src/socket/socket";

// Mock de socket.io Server
jest.mock("socket.io", () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
  };
});

describe("socket.ts", () => {
  let initIO: any;
  let getIO: any;

  const loadModule = () => {
    jest.isolateModules(() => {
      const socketModule = require("../../src/socket/socket");
      initIO = socketModule.initIO;
      getIO = socketModule.getIO;
    });
  };

  beforeEach(() => {
    jest.resetModules();
    loadModule();
  });

  it("throws if getIO is called before init", () => {
    expect(() => getIO()).toThrow("Socket.IO non initialisé");
  });

  it("initializes socket.io only once", () => {
    const server = http.createServer();

    const io1 = initIO(server);
    const io2 = initIO(server);

    expect(io1).toBe(io2);
  });


  it("registers connection handler", () => {
    const server = http.createServer();

    const io = initIO(server);

    expect(io.on).toHaveBeenCalledWith(
      "connection",
      expect.any(Function)
    );
  });
});

describe("socketService", () => {
  const emitMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("emitQuestValidated emits event", () => {
    jest.spyOn(socketModule, "getIO").mockReturnValue({
      emit: emitMock,
    } as any);

    socketService.emitQuestValidated({
      userQuestId: "1",
      validationCount: 2,
      status: "submitted",
      validatedBy: "user1",
    });

    expect(emitMock).toHaveBeenCalledWith(
      "questValidated",
      expect.any(Object)
    );
  });

  it("emitQuestValidated does not crash if getIO throws", () => {
    jest.spyOn(socketModule, "getIO").mockImplementation(() => {
      throw new Error("Socket not ready");
    });

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    socketService.emitQuestValidated({
      userQuestId: "1",
      validationCount: 2,
      status: "submitted",
      validatedBy: "user1",
    });

    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("emitPointsUpdated emits event", () => {
    jest.spyOn(socketModule, "getIO").mockReturnValue({
      emit: emitMock,
    } as any);

    socketService.emitPointsUpdated({
      userId: "user1",
      points: 10,
    });

    expect(emitMock).toHaveBeenCalledWith(
      "pointsUpdated",
      expect.any(Object)
    );
  });

  it("emitProposedQuestReviewed emits event", () => {
    jest.spyOn(socketModule, "getIO").mockReturnValue({
      emit: emitMock,
    } as any);

    socketService.emitProposedQuestReviewed({
      questId: "q1",
      title: "Nouvelle quête",
      authorId: "u1",
      status: "approved",
    });

    expect(emitMock).toHaveBeenCalledWith(
      "proposedQuestReviewed",
      expect.any(Object)
    );
  });
});