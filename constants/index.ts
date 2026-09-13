import { AgentSettingsObject, ThinkSettings } from "@deepgram/agents";
import { z } from "zod";

export const mappings = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

/**
 * Client-side function the agent calls once it has said goodbye. Agent.tsx
 * answers it and then tears the call down, so the user never has to press END.
 */
export const END_CALL_FUNCTION_NAME = "end_call";

const endCallFunction: ThinkSettings.Functions.Item = {
  name: END_CALL_FUNCTION_NAME,
  description:
    "Hang up the call. Call this the moment you have finished saying goodbye and there is nothing left to say. Never call it before you have said goodbye, and never say anything after calling it.",
  parameters: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description:
          "Short note on why the call is ending, e.g. 'appointment booked' or 'checkup complete'.",
      },
    },
    required: ["reason"],
  },
};

/**
 * Phase 1 — front desk. Books the appointment and gathers the basics that
 * Gemini turns into the checkup questions. Deliberately does not diagnose.
 */
export const getIntakePrompt = (userName: string) =>
  `You are the receptionist at AlphaCare, on the phone with ${userName} to book them in for a health checkup.

Sound like an actual person working a front desk: warm, quick, slightly informal. Not a form, not a script.

Before you can book them in you need:
- what is bothering them, or what they want to be seen for
- how long it has been going on
- anything else they have noticed alongside it
- how bad it is, and whether it is getting in the way of their day
- any ongoing condition or medication they are already on

How to speak:
- Ask for one thing at a time, phrased the way a person would. Never number your questions and never announce them. Do not say "next question", "question two", "moving on", or "the next thing I need".
- Never read out the list of what you still need. Just ask the next thing.
- Say their name when you greet them and once when you say goodbye. Nowhere else. Never open a reply with "Thank you, ${userName}".
- Do not thank them for every answer. React briefly and differently each time, and never use the same reaction twice in a row.
- If they cover two things in one answer, do not ask again for what they already told you.
- One or two sentences per turn. Never more.

Boundaries:
- You are front desk staff, not a clinician. Do not say what might be causing it, do not diagnose, and do not suggest any treatment or medication. If they ask for your opinion, tell them that is exactly what the checkup is for.
- Never invent a doctor's name, a clinic address, a date, or a time slot.
- Never mention questions being prepared, forms, files, records, or anything happening on our side after the call. That is not something a receptionist would say.

Ending the call:
- Once you have all five details, confirm they are booked in with one natural line, using their name — something along the lines of "Alright ${userName}, you're all booked in."
- Say goodbye, then immediately call the ${END_CALL_FUNCTION_NAME} function.`;

/**
 * Phase 2 — the consultation. Works through the Gemini-generated questions and
 * then gives the user a plain-language assessment and next steps.
 */
export const getCheckupPrompt = (userName: string, questions: string[]) => {
  const numbered = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

  return `You are the doctor seeing ${userName} for their checkup. Speak like a real clinician in a consultation room: calm, direct, and genuinely interested in the answer.

Work through these, in this order:
${numbered}

How to speak:
- Ask one thing at a time, in your own words. Never number them out loud and never announce them. Do not say "next question", "question three", "moving on", or "let's go to the next one".
- Wait for the answer before asking the next thing. If an answer is vague or something in it needs pinning down, follow up on it right there instead of pressing on.
- Say their name when you greet them and once at the end. Nowhere else. Do not thank them for each answer.
- React briefly and differently each time — a short "Okay", "Mm-hm", "Right, and does that change through the day?" Never repeat the same filler twice in a row.
- One or two sentences per turn while you are still asking. This is a conversation, not a lecture.

Once you have been through everything, give ${userName} your assessment out loud, in plain language:
1. What you think is most likely going on, based on what they actually described.
2. What they should do about it — specific and practical. What to change, what to try, what to watch.
3. When they need to be seen in person, and the specific warning signs that would mean going in urgently.

Assessment rules:
- Commit to an answer. Say "this looks most like..." rather than refusing to give a view.
- Say once, briefly, that this is based on a voice consultation and an in-person examination would confirm it. Do not keep repeating that.
- Do not name prescription drugs or give doses. General measures are fine — rest, fluids, heat or ice, hydration, sleep, diet, cutting back on something, or seeing a GP or specialist.
- Keep the whole assessment to roughly thirty to forty-five seconds of speech.

Ending the call:
- Say goodbye to ${userName}, then immediately call the ${END_CALL_FUNCTION_NAME} function.`;
};

const getGreeting = (phase: "intake" | "checkup", userName: string) =>
  phase === "intake"
    ? `Hi ${userName}, thanks for calling AlphaCare. What can I book you in for?`
    : `Hi ${userName}, good to speak with you. So, tell me what's been going on.`;

interface AgentConfigParams {
  /** "generate" is the intake call, "interview" is the checkup call. */
  type: "generate" | "interview";
  userName: string;
  questions?: string[];
}

export const getAgentConfig = ({
  type,
  userName,
  questions = [],
}: AgentConfigParams): AgentSettingsObject => {
  const phase = type === "interview" ? "checkup" : "intake";
  const prompt =
    phase === "checkup"
      ? getCheckupPrompt(userName, questions)
      : getIntakePrompt(userName);

  return {
    greeting: getGreeting(phase, userName),
    listen: {
      provider: {
        type: "deepgram",
        model: "nova-3",
        language: "en",
        version: "v1",
      },
    },
    think: {
      provider: {
        type: "google",
        model: "gemini-2.5-flash",
        version: "v1beta",
      },
      prompt,
      functions: [endCallFunction],
    },
    speak: {
      provider: {
        type: "deepgram",
        model: "aura-2-thalia-en",
        version: "v1",
      },
    },
  };
};

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "A category drawn from what this checkup actually discussed, e.g. 'Symptom Severity' or 'Impact on Daily Life'."
          ),
        score: z.number().describe("0-100, where higher is healthier."),
        comment: z
          .string()
          .describe("What the transcript showed for this category."),
      })
    )
    .describe(
      "Three to five categories, all of them grounded in the transcript. Never include a category the conversation did not cover."
    ),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];
