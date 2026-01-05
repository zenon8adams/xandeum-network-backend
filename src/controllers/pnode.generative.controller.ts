import { Response } from "express";
import { leafNodeInfoArraySchema } from "@/modules/pnode/types";
import type { TypedRequest } from "@/types/request.types";
import { StatusCodes } from "http-status-codes";
import MongoQueryMCP from "@/modules/generative/mcp";
import { logger } from "@/utils";

export const findBestLeafNodeEndpoint = async (
  req: TypedRequest<{ prompt: string }>,
  res: Response
): Promise<void> => {
  const prompt = req.body.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "fail",
      message: "Prompt is required",
    });
    return;
  }

  const result = await MongoQueryMCP.ask(prompt);

  if (!result) {
    logger.error("[findBestLeafNodeEndpoint] error:", result);
    res.status(StatusCodes.NOT_FOUND).json({
      status: "error",
      message: "Unable of find match for query",
    });
    return;
  }

  const validated = leafNodeInfoArraySchema.safeParse(result);
  if (!validated.success) {
    logger.error("[findBestLeafNodeEndpoint] error:", result);
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: "Unable of find match for query",
    });
    return;
  }

  const matchingEndpoints = validated.data.map((item) => item.address.endpoint);
  const endpoints = matchingEndpoints.filter(
    (endpoint, index, array) => array.indexOf(endpoint) === index
  );
  res.status(StatusCodes.OK).json({
    status: "success",
    endpoints: endpoints,
  });
};
