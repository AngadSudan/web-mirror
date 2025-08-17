import "dotenv/config";
import { OpenAI } from "openai";
import scrapingTool from "./scrapingToll";

const TOOL_MAP = {
  scrapingTool: scrapingTool,
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const SYSTEM_PROMPT = `
    You are an AI assistant who works on START, THINK and OUTPUT format.
    For a given user query first think and breakdown the problem into sub problems.
    You should always keep thinking and thinking before giving the actual output.
    
    Also, before outputing the final result to user you must check once if everything is correct.
    You also have list of available tools that you can call based on user query.
    
    For every tool call that you make, wait for the OBSERVATION from the tool which is the
    response from the tool that you called.

    Available Tools:
    - scrapingTool(targetUrl:string) : function will take in the target url as a parameter and then scrape the website 

    Rules:
    - Strictly follow the output JSON format
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Alway make sure to do multiple steps of thinking before giving out output.
    - For every tool call always wait for the OBSERVE which contains the output from tool

    Output JSON Format:
    { "step": "START | THINK | OUTPUT | OBSERVE | TOOL" , "content": "string", "tool_name": "string", "input": "STRING" }

    Example:
    User: Clone the website https://piyushgarg.dev?
    ASSISTANT: { "step": "START", "content": "The user is intertested in the getting the website https://piyushgarg.dev offline" } 
    ASSISTANT: { "step": "THINK", "content": "Let me see if there is any available tool for this query" } 
    ASSISTANT: { "step": "THINK", "content": "I see that there is a tool available scrapingTool which scrapes the website locally" } 
    ASSISTANT: { "step": "THINK", "content": "I need to call scrapingTool for city targetUrl https://piyushgarg.dev to get website locally" }
    ASSISTANT: { "step": "TOOL", "input": "https://piyushgarg.dev", "tool_name": "getWeatherDetailsByCity" }
    DEVELOPER: { "step": "OBSERVE", "content": "The website has been cloned locally" }
    ASSISTANT: { "step": "THINK", "content": "Great, the task is done" }
    ASSISTANT: { "step": "OUTPUT", "content": "The website has been cloned locally for you ☔️" }
  `;

  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: "clone the url https://piyushgarg.dev for me.",
    },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
    });

    const rawContent = response.choices[0].message.content;
    const parsedContent = JSON.parse(rawContent);

    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });

    if (parsedContent.step === "START") {
      console.log(`🔥`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === "THINK") {
      console.log(`\t🧠`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === "TOOL") {
      const toolToCall = parsedContent.tool_name;
      if (!TOOL_MAP[toolToCall]) {
        messages.push({
          role: "developer",
          content: `There is no such tool as ${toolToCall}`,
        });
        continue;
      }

      const responseFromTool = await TOOL_MAP[toolToCall](parsedContent.input);
      console.log(
        `🛠️: ${toolToCall}(${parsedContent.input}) = `,
        responseFromTool
      );
      messages.push({
        role: "developer",
        content: JSON.stringify({ step: "OBSERVE", content: responseFromTool }),
      });
      continue;
    }

    if (parsedContent.step === "OUTPUT") {
      console.log(`🤖`, parsedContent.content);
      break;
    }
  }

  console.log("Done...");
}

main();
