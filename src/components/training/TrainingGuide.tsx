
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    ChevronRight,
    ChevronLeft,
    Building2,
    PieChart,
    Target,
    FileDown,
    CheckCircle2,
    Lightbulb,
    ArrowRight
} from "lucide-react";

const steps = [
    {
        title: "Multi-Branch Management",
        description: "Scale your pharmacy across multiple locations with centralized control.",
        icon: Building2,
        color: "text-blue-500",
        bg: "bg-blue-50",
        content: (
            <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                    PharmCare Pro now supports multi-branch operations. Every transaction, expense, and inventory item is now attributed to a specific branch.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                        Pro Tip
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Admins can view consolidated reports for all branches at once, or filter down to a single location to analyze local performance.
                    </p>
                </div>
                <ul className="space-y-2">
                    {[
                        "Regional inventory tracking",
                        "Branch-specific staff shifts",
                        "Isolated financial accounting"
                    ].map(item => (
                        <li key={item} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        )
    },
    {
        title: "Profit & Loss Reporting",
        description: "Deep dive into your financial health with automated P&L statements.",
        icon: PieChart,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        content: (
            <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                    Our new P&L report automatically calculates Revenue, COGS, and Operating Expenses (OPEX) to give you a real-time Net Profit figure.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 border rounded bg-background text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">Revenue</div>
                        <div className="text-sm font-bold text-emerald-600">Sales Income</div>
                    </div>
                    <div className="p-2 border rounded bg-background text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">COGS</div>
                        <div className="text-sm font-bold text-rose-600">Inventory Cost</div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                    Visual charts help you identify which branch contributes most to your bottom line.
                </p>
            </div>
        )
    },
    {
        title: "Budgeting & Variances",
        description: "Set financial goals and monitor performance against targets.",
        icon: Target,
        color: "text-amber-500",
        bg: "bg-amber-50",
        content: (
            <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                    Stop guessing your performance. The Budget vs Actual module allows you to set monthly targets for revenue and spending categories.
                </p>
                <div className="space-y-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[75%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-medium">
                        <span>Actual: ₦750k</span>
                        <span>Budget: ₦1M</span>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Instantly see where you are over-spending or under-performing with automated variance analysis (%).
                </p>
            </div>
        )
    },
    {
        title: "Accountant-Ready Exports",
        description: "Simplify tax season and audits with one-click data exports.",
        icon: FileDown,
        color: "text-purple-500",
        bg: "bg-purple-50",
        content: (
            <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                    Need to share data with your accountant? All financial reports can now be exported directly to CSV format with a single click.
                </p>
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <FileDown className="h-8 w-8 text-primary animate-bounce" />
                    <div>
                        <div className="text-sm font-bold">Standardized Format</div>
                        <div className="text-xs text-muted-foreground">Compatible with Excel, QuickBooks & Sage</div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Available in Profit & Loss and Budget vs Actual dashboards.
                </p>
            </div>
        )
    }
];

export const TrainingGuide = () => {
    const [currentStep, setCurrentStep] = useState(0);

    const next = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prev = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <Card className="max-w-2xl mx-auto overflow-hidden border-none shadow-2xl bg-gradient-to-br from-background to-muted/20">
            <div className={`h-28 ${step.bg} flex items-center justify-center transition-colors duration-500`}>
                <div className={`p-4 rounded-full bg-white shadow-lg`}>
                    <Icon className={`h-10 w-10 ${step.color}`} />
                </div>
            </div>

            <CardHeader className="text-center">
                <div className="flex justify-center gap-1 mb-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'}`}
                        />
                    ))}
                </div>
                <Badge variant="outline" className="w-fit mx-auto mb-2 bg-background">
                    Step {currentStep + 1} of {steps.length}
                </Badge>
                <CardTitle className="text-2xl font-bold">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
            </CardHeader>

            <CardContent className="min-h-[250px] px-8 pb-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {step.content}
                </div>
            </CardContent>

            <div className="p-4 bg-muted/40 border-t flex justify-between items-center px-8">
                <Button
                    variant="ghost"
                    onClick={prev}
                    disabled={currentStep === 0}
                    className="gap-2"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </Button>

                {currentStep === steps.length - 1 ? (
                    <Button className="gap-2 bg-green-600 hover:bg-green-700">
                        Finish & Start Exploring
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={next} className="gap-2">
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </Card>
    );
};
