import { ControllerResponse } from "../types/response.types.js"

export const healthControllers = {
  checkLiveness: async (): Promise<ControllerResponse> => {
    return {
      status: 204,
      body: {},
    }
  }
}
