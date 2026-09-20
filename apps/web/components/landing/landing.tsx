import { SiteHeader } from "./site-header";
import { Architecture, Authorization, ChainOfCustody, EvidenceDetails, EvidenceSection, FinalSection, HistorySearch, Hero, LandingFooter, OutcomeComparison, Principles, ResponseWindow, SignalMap, Story, Workflow } from "./landing-sections";

export function TraceholdLanding() {
  return <main className="min-h-screen overflow-hidden bg-background text-foreground"><SiteHeader /><Hero /><Workflow /><SignalMap /><Story /><ResponseWindow /><HistorySearch /><EvidenceSection /><EvidenceDetails /><ChainOfCustody /><Authorization /><Architecture /><OutcomeComparison /><Principles /><FinalSection /><LandingFooter /></main>;
}
