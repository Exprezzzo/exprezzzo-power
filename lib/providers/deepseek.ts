import { ProviderAdapter } from "./base";

export class DeepSeekAdapter implements ProviderAdapter {
  id = "deepseek";
  requiresKyc = false;
  
  async *send(prompt: string, ctx: { model: string }) {
    const tokens = prompt.split(" ");
    for (const token of tokens) {
      yield { token: token + " " };
    }
  }
  
  estimateCost(input: number, output: number) {
    return (input * 0.001 + output * 0.002) / 1000;
  }
}