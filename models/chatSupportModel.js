const mongoose = require("mongoose");
// const { toJSON, paginate } = require('./plugins');

const chatSchema = mongoose.Schema(
  {
    // company: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Company',
    // },
    avatar: {
      type: String,
      default:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAACUCAMAAAAqEXLeAAAAY1BMVEX///8AAAATExO9vb36+vr39/fz8/MtLS24uLjg4OB5eXmBgYHc3Nzl5eXFxcVcXFwfHx8NDQ2IiIhxcXGfn59kZGRQUFA0NDTNzc1WVlbW1tYlJSUYGBhAQECurq6Xl5dISEjgsj2iAAAEFUlEQVR4nO2cC7KqMAxAqUIF5SsgKMh1/6t84r08FaS0TUlkhrOCM61JS5JqWSsrK7Q4PPiDO9Qun/HdLD3X7EF9TjPXpzbqw7OoYD2KKOPUXk94GPUFO6LwSzzHFR+aW2q/O0GUiBxbzYBY0ckmDB/Q/ja5cKefnAkty52cI2O7ksrRjWUdGYtdGsftVMS8kZBEuavkeLckWMtLpebIWHXBdnQGp+A0BfKtw07VHRlLbVRJV8eRMdSfJddzZAwzqR90JQ94juqR3YEX4bb2Qt6XEit2vFpfsvaQJH/0HRn7QZLcQCQ3OI4+xJExnI9IQNi0HFEkc5hkjuHoXWGSV4z43sIcGQsRJBuoZIMgCcqSLRiZ8giVRAhvew+V3M9/fDvADHTPQfN/RaySpljEb3IR0b2MPLmIEyeESmKc3cEN5nhDqU4v4T4JDW+cLzEPJon0TatQhR4S4zhaUm2RMTIkSU+7FMTYDq3zBAgdnA/aFk+6fzNYSKxSkAVYSryFvN/XNOtqNWrRXK3R1IHdcNK6+u5xHS3rpO54wna0POVuU4EY2R2hYkqvMO6RA0qlMzwm6niHCjmdZh1bfOnoORFOMsn2QVPSqTBb6tuxwe3ODnHSifiJaZfxj1K45ynZHMs7tj/aNdn71Dv9gtPsb707R3JLm2/Y6DeCsjl284lFdGxK6hG1UWyb37G/aI9XVlYAcM+/lOF2QBheLh6nj/SgzA5pfi1Gzu94d43SQxaSpUyHbw/St95q7wboI7P2JVMu+OZZiXlMOs1ZqxpUnX6QltO5gIrmUYng6WpNTr6Sz3xRt0ONwsWQmzujZmlE8aEZzqTJU8AgXZ8knyN3Og1oRO2DpvkXER64Fz8kMlwxcDUmtqepTDZsOXhaYIzU2JZ7kg9adDgb2nLgvOQURooHruGo7pMY+GGazjxDNmBLULNTFmALvNHq16iSgFq3mu8w1AHsOHjoVB7t9yW+djNWnUozEzkov8f/aJ09zoznzCe0HmCiJJ9XNBIReNpLHeXg4YBhEF1q1Q0HPnDQQ7EfjpbF31HacBv4vkEXpeeX4GlTXRSmXQKD365qbOQv6uDZYn2kl7LEPQ/fkT3DZ/s2lCGVc9R+KGsGufILSR5/IpXRA6Ic2VHILCV42B2KxAcPn6EypUY0fc+YuV4hw3RCJ0zkHdMv1QnukX3qKUfgpLsZpp7Tk91/Xpk6wMljuyUXtyagr3nNcBXHd0h5AXoinmMkP25+Edav4O/9zCD8ExfHWF8Oxk30QUZ8lXwiOr4DarkO0XWNoAD0GVF4o1fSxhDdKb/gCvSL6GD8ikOxRfS48SsOxZarQBKxki9mt0oaYhGSlUAS+CraHKLoLqnl/oiFj6DCa7IhJ8m/7i9+V1YWyD8iPUigmeR1DAAAAABJRU5ErkJggg==",
    },
    chatName: {
      type: String,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    // groupType: {
    //   type: String,
    //   enum:["All Admins", "All Users", "Selected Users"]
    // },
    // isCompanyGroup: {
    //   type: Boolean,
    //   default: false,
    // },
    // isAllUsers: {
    //   type: Boolean,
    //   default: false,
    // },
    // isAllAdmins: {
    //   type: Boolean,
    //   default: false,
    // },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appusers",
    },
    chatSupport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    // users: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Appusers",
    //   },
    // ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // groupAdmin: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    readBy: [
      {
        readerId: { type: String },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// chatSchema.plugin(toJSON);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
