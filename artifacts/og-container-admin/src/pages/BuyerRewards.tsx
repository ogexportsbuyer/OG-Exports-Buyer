import { useMemo } from "react"
import { Link } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import { Award, ArrowRight, BadgeCheck, LockKeyhole, TrendingUp } from "lucide-react"
import { BuyerPortalLayout } from "@/components/buyer/BuyerPortalLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSafeAuth } from "@/lib/use-safe-auth"
import { notify } from "@/lib/notify"
import { getGetBuyerRewardsQueryKey, useGetBuyerRewards } from "@workspace/api-client-react"

const money = (value: number | undefined, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value ?? 0)

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character)
}

export default function BuyerRewards() {
  const { userId } = useSafeAuth()
  const queryClient = useQueryClient()
  const stableId = String(userId ?? "")
  const rewardsQuery = useGetBuyerRewards({
    query: { enabled: !!stableId, queryKey: [...getGetBuyerRewardsQueryKey(), stableId], retry: false },
  })
  const summary = rewardsQuery.data?.data
  const tiers = useMemo(() => [...(summary?.tiers ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [summary?.tiers])
  const current = summary?.current_tier
  const next = summary?.next_tier
  const certificate = (summary?.active_rewards ?? []).find(reward => /certificate/i.test(`${reward.type} ${reward.title}`))

  function downloadCertificate() {
    if (!certificate) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      notify.error("Allow pop-ups to print or save your certificate.")
      return
    }
    printWindow.opener = null
    const title = escapeHtml(certificate.title ?? "VIP buyer certificate")
    const description = escapeHtml(certificate.description ?? "")
    const tierName = escapeHtml(current?.name ?? "Buyer rewards member")
    const account = escapeHtml(stableId)
    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><title>OG Exports VIP Certificate</title>
      <style>
        @page { size: A4 landscape; margin: 18mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; color: #163937; background: #fff; }
        main { min-height: 165mm; display: grid; place-content: center; text-align: center; border: 3px solid #f0b43d; padding: 28mm 20mm; }
        .brand { color: #0f3d3a; font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; }
        h1 { margin: 22px 0 10px; font-size: 36px; }
        .tier { color: #a8791e; font-size: 24px; font-weight: 700; }
        .description { max-width: 640px; margin: 16px auto; color: #53635e; line-height: 1.6; }
        .account { margin-top: 28px; font-size: 12px; color: #53635e; }
      </style></head><body><main>
        <p class="brand">OG Exports · Buyer VIP Rewards</p>
        <h1>${title}</h1>
        <p class="tier">${tierName}</p>
        ${description ? `<p class="description">${description}</p>` : ""}
        <p class="account">Issued to OG Exports buyer account ${account}</p>
      </main></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 250)
    notify.success("Use the print dialog to save your certificate as a PDF.")
  }

  return (
    <BuyerPortalLayout title="VIP rewards" subtitle="Long-term trade value, tier progress and approved benefits">
      <div className="mx-auto max-w-6xl space-y-6">
        {rewardsQuery.isLoading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-muted" /><div className="h-56 animate-pulse rounded-2xl bg-muted" /></div> : null}
        {rewardsQuery.isError ? (
          <Card><CardContent className="p-8 text-center"><p className="font-semibold">VIP information is temporarily unavailable.</p><Button className="mt-4" onClick={() => void queryClient.invalidateQueries({ queryKey: [...getGetBuyerRewardsQueryKey(), stableId] })}>Try again</Button></CardContent></Card>
        ) : null}
        {!rewardsQuery.isLoading && !rewardsQuery.isError && summary ? (
          <>
            <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground md:p-9">
              <div className="absolute -right-8 -top-16 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -right-1 top-0 h-48 w-48 rounded-full border border-white/10" />
              <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"><Award className="h-4 w-4 text-accent" /> Buyer VIP programme</div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/65">Current rewards tier</p>
                  <h2 className="mt-2 font-heading text-4xl font-semibold md:text-5xl">{current?.name ?? "Building your trade history"}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">
                    {summary.is_manually_assigned ? "Your tier is currently assigned by the OG Exports team." : "Tier qualification follows your approved qualifying order value."}
                  </p>
                </div>
                <div className="min-w-52 border-l border-white/20 pl-6">
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/60">Qualifying spend</p>
                  <p className="mt-2 font-heading text-3xl font-semibold">{money(summary.qualifying_spend_usd, summary.currency)}</p>
                  {current?.discount_percentage ? <p className="mt-2 text-sm text-accent">{current.discount_percentage}% VIP pricing benefit</p> : <p className="mt-2 text-sm text-primary-foreground/65">Pricing benefit configured by tier</p>}
                </div>
              </div>
            </section>

            {next ? (
              <Card className="border-primary/15">
                <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Progress to {next.name}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{money(summary.spend_to_next_tier_usd, summary.currency)} in qualifying trade value remaining</p>
                  </div>
                  <div className="md:w-72">
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Current progress</span><span>{Math.round(summary.progress_percentage ?? 0)}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-transform" style={{ width: `${Math.min(100, Math.max(0, summary.progress_percentage ?? 0))}%` }} /></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm"><strong>Top tier reached.</strong> Your account currently qualifies for the highest active rewards tier.</div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <Card>
                <CardContent className="p-5 md:p-6">
                  <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Benefits in force</p><h3 className="mt-1 font-heading text-xl font-semibold">Your active rewards</h3></div><BadgeCheck className="h-5 w-5 text-primary" /></div>
                  {(summary.active_rewards ?? []).length ? <div className="divide-y divide-border">{summary.active_rewards?.map(reward => <div key={reward.id} className="flex gap-3 py-4 first:pt-0"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Award className="h-4 w-4 text-primary" /></div><div className="min-w-0 flex-1"><p className="font-semibold">{reward.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{reward.description || "Benefit details are confirmed by your OG Exports trade desk."}</p>{reward.requires_admin_approval ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700"><LockKeyhole className="h-3.5 w-3.5" /> Requires team approval before use</p> : null}</div></div>)}</div> : <div className="rounded-xl bg-muted/60 p-5 text-sm text-muted-foreground">No active rewards are attached to your account yet. Your qualifying spend and tier progress remain visible here.</div>}
                  {certificate ? <Button className="mt-5 gap-2" onClick={downloadCertificate}><Award className="h-4 w-4" /> Download certificate</Button> : null}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 md:p-6">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Programme structure</p><h3 className="mb-4 mt-1 font-heading text-xl font-semibold">Qualification by trade value</h3>
                  <div className="space-y-2">{tiers.map((tier, index) => {
                    const reached = (summary.qualifying_spend_usd ?? 0) >= (tier.minimum_spend_usd ?? 0)
                    const benefitTitles = (tier.rewards ?? []).map(reward => reward.title).filter(Boolean)
                    return <div key={tier.id} className={`flex items-center gap-3 rounded-xl border p-3 ${tier.id === current?.id ? "border-primary/30 bg-primary/5" : "border-border"}`}><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{String(index + 1).padStart(2, "0")}</div><div className="min-w-0 flex-1"><p className="font-semibold">{tier.name}</p><p className="text-xs text-muted-foreground">{money(tier.minimum_spend_usd, summary.currency)} lifetime qualifying spend</p>{benefitTitles.length ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{benefitTitles.join(" · ")}</p> : null}</div><div className="text-right"><p className="font-mono text-sm font-semibold">{tier.discount_percentage ?? 0}%</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">VIP rate</p></div><ArrowRight className={`h-4 w-4 ${tier.id === current?.id ? "text-primary" : "text-muted-foreground/40"}`} /></div>
                  })}</div>
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">VIP rewards are separate from your buyer trust score. Fulfilment benefits are coordinated with staff; physical goods and allocations are never automatic.</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4"><div><p className="font-semibold">Review server-calculated buyer pricing</p><p className="mt-1 text-sm text-muted-foreground">Applicable product and VIP discounts are reflected in your catalogue prices.</p></div><Button variant="outline" asChild><Link href="/buyer/catalogue">Open catalogue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
          </>
        ) : null}
      </div>
    </BuyerPortalLayout>
  )
}
