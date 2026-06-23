import Board from "@/components/Board";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="app">
      <div className="app-header">
        <h1>Issues</h1>
        <ThemeToggle />
      </div>
      <Board />
    </main>
  );
}
