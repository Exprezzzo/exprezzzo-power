import { ProviderAdapter } from "./base";

export class OpenAIAdapter implements ProviderAdapter {
  id = "openai";
  requiresKyc = false;
  
  async *send(prompt: string, ctx: { model: string }) {
    const tokens = prompt.split(" ");
    for (const token of tokens) {
      yield { token: token + " " };
    }
  }
  
  estimateCost(input: number, output: number) {
    return (input * 0.03 + output * 0.06) / 1000;
  }
}