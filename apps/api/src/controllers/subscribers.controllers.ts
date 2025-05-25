import {
  insertEmailSubscriber,
  getEmailSubscriberByEmail,
  getAllActiveSubscribers
} from "@dsqr-dotdev/database"
import { ApiResponse, ControllerResponse } from "../types/response.types.js"

export const subscriberControllers = {
  getAllSubscribers: async (): Promise<ApiResponse> => {
    const subscribers = await getAllActiveSubscribers()
    return {
      data: subscribers,
      meta: {
        count: subscribers.length,
        timestamp: new Date().toISOString(),
      }
    }
  },

  getSubscriberByEmail: async (email: string): Promise<ControllerResponse> => {
    const subscriber = await getEmailSubscriberByEmail(email)
    
    if (!subscriber) {
      return {
        status: 404,
        body: {
          errors: [
            {
              status: "404",
              title: "Subscriber Not Found",
              detail: `No subscriber found with email: ${email}`
            }
          ]
        }
      }
    }
    
    return {
      status: 200,
      body: {
        data: subscriber,
        meta: {
          timestamp: new Date().toISOString()
        }
      }
    }
  },

  createSubscriber: async (email: string): Promise<ControllerResponse> => {
    const existingSubscriber = await getEmailSubscriberByEmail(email)
    
    if (existingSubscriber) {
      return {
        status: 409,
        body: {
          errors: [
            {
              status: "409",
              title: "Resource Already Exists",
              detail: `A subscriber with email ${email} already exists`
            }
          ]
        }
      }
    }

    const newSubscriber = await insertEmailSubscriber({ email })
    
    return {
      status: 201,
      body: {
        data: newSubscriber,
        meta: {
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}