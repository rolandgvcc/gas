import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function AboutCard() {
  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Dungeon Adventure</CardTitle>
          <CardDescription>An AI-powered text adventure game</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground/90 leading-normal prose"> 
          <p className="mb-3">Embark on a thrilling journey through a mysterious dungeon filled with danger, treasures, and unexpected twists.</p>
          <p className="mb-3">This text-based adventure game uses AI to create a unique experience every time you play. Your choices will determine your fate as you navigate through the dungeon's depths.</p>
          <p className="mb-3 font-semibold">Game Features:</p>
          <ul className="flex flex-col mb-2">
            <li>→ Dynamic storytelling that adapts to your choices</li>
            <li>→ Multiple possible endings and outcomes</li>
            <li>→ Dangers, treasures, and surprises await</li>
            <li>→ Track your progress and see how far you can get</li>
          </ul>
          <p>Press "Begin Adventure" to start your journey into the unknown!</p>
        </CardContent>
      </Card>
    </div>
  )
}
