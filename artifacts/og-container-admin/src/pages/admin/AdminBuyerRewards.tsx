import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Award, Search, Plus, Save, Trash2, Users, Layers3, Gift, ArrowUp, ArrowDown, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { notify } from "@/lib/notify"
import {
  getGetAdminBuyerRewardBuyersQueryKey, getGetAdminBuyerRewardTiersQueryKey, getGetAdminBuyerRewardsQueryKey,
  useCreateAdminBuyerReward, useCreateAdminBuyerRewardTier, useDeleteAdminBuyerReward,
  useDeleteAdminBuyerRewardTier,
  useGetAdminBuyerRewardBuyers, useGetAdminBuyerRewardTiers, useGetAdminBuyerRewards,
  useReorderAdminBuyerRewardTiers, useUpdateAdminBuyerReward, useUpdateAdminBuyerRewardBuyerTier,
  useUpdateAdminBuyerRewardTier,
  type BuyerReward, type BuyerRewardTier,
} from "@workspace/api-client-react"

type TierDraft = { name: string; slug: string; minimum_spend_usd: string; discount_percentage: string; is_active: boolean }
const emptyTier: TierDraft = { name: "", slug: "", minimum_spend_usd: "0", discount_percentage: "0", is_active: true }
const inputClass = "h-10 bg-background"

export default function AdminBuyerRewards() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [buyerPage, setBuyerPage] = useState(1)
  const [tierDraft, setTierDraft] = useState<TierDraft>(emptyTier)
  const [rewardDraft, setRewardDraft] = useState({ tier_id: "", title: "", description: "", type: "discount", requires_admin_approval: false })
  const [editingTierId, setEditingTierId] = useState<number | null>(null)
  const [editingRewardId, setEditingRewardId] = useState<number | null>(null)
  const [override, setOverride] = useState<Record<string, { tier_id: string; reason: string }>>({})
  const tiersQuery = useGetAdminBuyerRewardTiers({ query: { queryKey: getGetAdminBuyerRewardTiersQueryKey(), retry: false } })
  const rewardsQuery = useGetAdminBuyerRewards({ query: { queryKey: getGetAdminBuyerRewardsQueryKey(), retry: false } })
  const buyerParams = useMemo(() => ({ search: search || undefined, per_page: 100, page: buyerPage }), [search, buyerPage])
  const buyersQuery = useGetAdminBuyerRewardBuyers(buyerParams, { query: { queryKey: getGetAdminBuyerRewardBuyersQueryKey(buyerParams), retry: false } })
  const createTier = useCreateAdminBuyerRewardTier()
  const updateTier = useUpdateAdminBuyerRewardTier()
  const reorderTiers = useReorderAdminBuyerRewardTiers()
  const createReward = useCreateAdminBuyerReward()
  const updateReward = useUpdateAdminBuyerReward()
  const deleteReward = useDeleteAdminBuyerReward()
  const deleteTier = useDeleteAdminBuyerRewardTier()
  const updateBuyerTier = useUpdateAdminBuyerRewardBuyerTier()
  const tiers = tiersQuery.data?.data ?? []
  const rewards = rewardsQuery.data?.data ?? []
  const buyers = buyersQuery.data?.data ?? []
  const loading = tiersQuery.isLoading || rewardsQuery.isLoading || buyersQuery.isLoading
  const busy = createTier.isPending || updateTier.isPending || reorderTiers.isPending || createReward.isPending || updateReward.isPending || deleteReward.isPending || deleteTier.isPending || updateBuyerTier.isPending

  async function refreshAll() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getGetAdminBuyerRewardTiersQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetAdminBuyerRewardsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetAdminBuyerRewardBuyersQueryKey() }),
    ])
  }
  function saveTier(tier?: BuyerRewardTier) {
    if (!tierDraft.name.trim()) return notify.error("Tier name is required")
    const data = { name: tierDraft.name.trim(), slug: tierDraft.slug.trim() || null, minimum_spend_usd: Number(tierDraft.minimum_spend_usd), discount_percentage: Number(tierDraft.discount_percentage), is_active: tierDraft.is_active }
    const done = () => { void refreshAll(); setTierDraft(emptyTier); setEditingTierId(null); notify.success(editingTierId ? "Tier updated" : "Tier created") }
    if (editingTierId) updateTier.mutate({ id: editingTierId, data }, { onSuccess: done, onError: e => notify.error(e.message) })
    else createTier.mutate({ data }, { onSuccess: done, onError: e => notify.error(e.message) })
  }
  function saveReward() {
    if (!rewardDraft.tier_id || !rewardDraft.title.trim()) return notify.error("Choose a tier and enter a reward title")
    const data = { tier_id: Number(rewardDraft.tier_id), title: rewardDraft.title.trim(), description: rewardDraft.description.trim() || null, type: rewardDraft.type, requires_admin_approval: rewardDraft.requires_admin_approval }
    const onSuccess = () => { void refreshAll(); setEditingRewardId(null); setRewardDraft({ tier_id: "", title: "", description: "", type: "discount", requires_admin_approval: false }); notify.success(editingRewardId ? "Benefit updated" : "Benefit added") }
    if (editingRewardId) updateReward.mutate({ id: editingRewardId, data }, { onSuccess, onError: e => notify.error(e.message) })
    else createReward.mutate({ data: { ...data, is_active: true } }, { onSuccess, onError: e => notify.error(e.message) })
  }
  function toggleReward(reward: BuyerReward) {
    if (!reward.id) return
    updateReward.mutate({ id: reward.id, data: { is_active: !reward.is_active } }, { onSuccess: () => { void refreshAll(); notify.success(reward.is_active ? "Benefit paused" : "Benefit activated") }, onError: e => notify.error(e.message) })
  }
  function removeReward(reward: BuyerReward) {
    if (!reward.id || !window.confirm(`Remove “${reward.title}”?`)) return
    deleteReward.mutate({ id: reward.id }, { onSuccess: () => { void refreshAll(); notify.success("Benefit removed") }, onError: e => notify.error(e.message) })
  }
  function removeTier(tier: BuyerRewardTier) {
    if (!tier.id) return
    if (!window.confirm(`Delete the ${tier.name} tier and all of its reward definitions? This cannot be undone.`)) return
    deleteTier.mutate({ id: tier.id }, {
      onSuccess: () => { void refreshAll(); notify.success("Tier and its reward definitions removed") },
      onError: error => {
        const message = error.message || "Tier could not be deleted."
        const status = (error as Error & { status?: number; response?: { status?: number } }).status
          ?? (error as Error & { response?: { status?: number } }).response?.status
        notify.error(status === 422 || /422|manual assignment|assignment/i.test(message)
          ? "This tier cannot be deleted while a buyer has a manual assignment. Clear or reassign those overrides first."
          : message)
      },
    })
  }
  function moveTier(index: number, direction: -1 | 1) {
    const next = [...tiers]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderTiers.mutate({ data: { tiers: next.map((tier, sort_order) => ({ id: tier.id!, sort_order })) } }, { onSuccess: refreshAll, onError: e => notify.error(e.message) })
  }

  return <AdminLayout title="Buyer VIP rewards" subtitle="Configure qualification, benefits and account-level exceptions">
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-7">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Active tiers", value: tiers.filter(t => t.is_active).length, icon: Layers3 },
          { label: "Live benefits", value: rewards.filter(r => r.is_active).length, icon: Gift },
          { label: "Buyer accounts", value: buyersQuery.data?.meta?.total ?? buyers.length, icon: Users },
        ].map(item => <Card key={item.label}><CardContent className="flex items-center gap-3 p-4"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><item.icon className="h-4 w-4" /></div><div><p className="font-heading text-2xl font-semibold">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
      </div>
      {(tiersQuery.isError || rewardsQuery.isError || buyersQuery.isError) ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Some reward data could not be loaded. <button className="ml-2 underline" onClick={() => { void tiersQuery.refetch(); void rewardsQuery.refetch(); void buyersQuery.refetch() }}>Retry</button></div> : null}
      {loading ? <div className="grid gap-4 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-muted" /><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div> : <>
        <div className="grid gap-6 xl:grid-cols-[1fr_.95fr]">
          <Card><CardContent className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Thresholds & price settings</p><h2 className="mt-1 font-heading text-xl font-semibold">VIP tiers</h2></div><Award className="h-5 w-5 text-accent" /></div>
            <div className="space-y-2">{tiers.map((tier, index) => <div key={tier.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{tier.name}</span><Badge variant="outline">{tier.is_active ? "Active" : "Paused"}</Badge><span className="text-xs text-muted-foreground">{tier.slug}</span></div><p className="mt-1 text-xs text-muted-foreground">${(tier.minimum_spend_usd ?? 0).toLocaleString()} qualifying spend · {tier.discount_percentage ?? 0}% VIP price component</p></div>
              <div className="flex items-center gap-1"><Button size="icon" variant="ghost" aria-label="Move tier up" disabled={index === 0 || busy} onClick={() => moveTier(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Move tier down" disabled={index === tiers.length - 1 || busy} onClick={() => moveTier(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => { setEditingTierId(tier.id ?? null); setTierDraft({ name: tier.name ?? "", slug: tier.slug ?? "", minimum_spend_usd: String(tier.minimum_spend_usd ?? 0), discount_percentage: String(tier.discount_percentage ?? 0), is_active: !!tier.is_active }); document.getElementById("tier-editor")?.scrollIntoView({ behavior: "smooth" }) }}>Edit</Button><Button size="icon" variant="ghost" aria-label={`Delete ${tier.name} tier`} disabled={busy} onClick={() => removeTier(tier)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            </div>)}</div>
            <form id="tier-editor" className="mt-5 grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); saveTier() }}>
              <Input className={inputClass} placeholder="Tier name" aria-label="Tier name" value={tierDraft.name} onChange={e => setTierDraft({ ...tierDraft, name: e.target.value })} />
              <Input className={inputClass} placeholder="Slug (optional)" aria-label="Tier slug" value={tierDraft.slug} onChange={e => setTierDraft({ ...tierDraft, slug: e.target.value })} />
              <Input className={inputClass} type="number" min="0" placeholder="Minimum qualifying spend USD" aria-label="Minimum spend USD" value={tierDraft.minimum_spend_usd} onChange={e => setTierDraft({ ...tierDraft, minimum_spend_usd: e.target.value })} />
              <Input className={inputClass} type="number" min="0" max="99.99" step="0.01" placeholder="VIP discount %" aria-label="VIP discount percentage" value={tierDraft.discount_percentage} onChange={e => setTierDraft({ ...tierDraft, discount_percentage: e.target.value })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tierDraft.is_active} onChange={e => setTierDraft({ ...tierDraft, is_active: e.target.checked })} /> Tier active</label>
              <Button disabled={busy} className="gap-2"><Save className="h-4 w-4" /> {editingTierId ? "Save tier changes" : "Save new tier"}</Button>
            </form>
          </CardContent></Card>

          <Card><CardContent className="p-5 md:p-6">
            <div className="mb-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Benefit inventory</p><h2 className="mt-1 font-heading text-xl font-semibold">Reward benefits</h2></div>
            <form className="mb-4 grid gap-2 rounded-xl bg-muted/50 p-4" onSubmit={e => { e.preventDefault(); saveReward() }}>
              <select className={`${inputClass} rounded-md border border-input px-3 text-sm`} aria-label="Benefit tier" value={rewardDraft.tier_id} onChange={e => setRewardDraft({ ...rewardDraft, tier_id: e.target.value })}><option value="">Select tier</option>{tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <Input className={inputClass} placeholder="Benefit title" value={rewardDraft.title} onChange={e => setRewardDraft({ ...rewardDraft, title: e.target.value })} />
              <Input className={inputClass} placeholder="Description and practical conditions" value={rewardDraft.description} onChange={e => setRewardDraft({ ...rewardDraft, description: e.target.value })} />
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Input className={inputClass} placeholder="Benefit type (e.g. payment_terms)" value={rewardDraft.type} onChange={e => setRewardDraft({ ...rewardDraft, type: e.target.value })} /><label className="flex items-center gap-2 rounded-md border border-border px-3 text-xs"><input type="checkbox" checked={rewardDraft.requires_admin_approval} onChange={e => setRewardDraft({ ...rewardDraft, requires_admin_approval: e.target.checked })} /> Staff approval required</label></div>
              <Button disabled={busy || !tiers.length} className="gap-2"><Plus className="h-4 w-4" /> {editingRewardId ? "Save benefit changes" : "Add benefit"}</Button>
            </form>
            <div className="max-h-72 space-y-2 overflow-auto">{rewards.map(reward => <div key={reward.id} className="flex items-start gap-3 rounded-xl border border-border p-3"><div className="flex-1"><p className="font-semibold">{reward.title}</p><p className="mt-1 text-xs text-muted-foreground">{tiers.find(t => t.id === reward.tier_id)?.name ?? "Tier"} · {reward.type}</p>{reward.requires_admin_approval ? <p className="mt-1 flex items-center gap-1 text-xs text-amber-700"><ShieldCheck className="h-3 w-3" /> Approval required</p> : null}</div><Button size="sm" variant="ghost" disabled={busy} onClick={() => { setEditingRewardId(reward.id ?? null); setRewardDraft({ tier_id: String(reward.tier_id ?? ""), title: reward.title ?? "", description: reward.description ?? "", type: reward.type ?? "discount", requires_admin_approval: !!reward.requires_admin_approval }) }}>Edit</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => toggleReward(reward)}>{reward.is_active ? "Pause" : "Activate"}</Button><Button size="icon" variant="ghost" disabled={busy} aria-label={`Delete ${reward.title}`} onClick={() => removeReward(reward)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}</div>
          </CardContent></Card>
        </div>

        <Card><CardContent className="p-5 md:p-6">
           <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Account overrides</p><h2 className="mt-1 font-heading text-xl font-semibold">Buyer status & manual assignment</h2><p className="mt-1 text-sm text-muted-foreground">Manual changes require a reason and remain distinct from earned tier status.</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search buyer or email" value={search} onChange={e => { setSearch(e.target.value); setBuyerPage(1) }} /></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wider text-muted-foreground"><th className="py-3">Buyer</th><th>Earned tier</th><th>Current tier</th><th>Qualifying spend</th><th>Manual assignment</th></tr></thead><tbody>{buyers.map(buyer => {
            const id = buyer.buyer?.id
            const state = override[String(id)] ?? { tier_id: buyer.current_tier?.id ? String(buyer.current_tier.id) : "", reason: "" }
            return <tr key={id} className="border-b border-border/70 align-top"><td className="py-4"><p className="font-semibold">{buyer.buyer?.name || "Buyer account"}</p><p className="text-xs text-muted-foreground">{buyer.buyer?.email}</p></td><td className="py-4">{buyer.earned_tier?.name ?? "Not qualified"}</td><td className="py-4"><Badge variant="outline">{buyer.current_tier?.name ?? "No tier"}</Badge></td><td className="py-4 font-mono">${(buyer.qualifying_spend_usd ?? 0).toLocaleString()}</td><td className="py-3"><div className="flex gap-2"><select aria-label={`Manual tier for ${buyer.buyer?.name}`} className="h-9 min-w-32 rounded-md border border-input bg-background px-2 text-xs" value={state.tier_id} onChange={e => setOverride(current => ({ ...current, [String(id)]: { ...state, tier_id: e.target.value } }))}><option value="">Clear override</option>{tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><Input aria-label="Override reason" className="h-9 min-w-40" placeholder="Reason (required)" value={state.reason} onChange={e => setOverride(current => ({ ...current, [String(id)]: { ...state, reason: e.target.value } }))} /><Button size="sm" disabled={busy || !id || state.reason.trim().length < 4} onClick={() => updateBuyerTier.mutate({ id: Number(id), data: { tier_id: state.tier_id ? Number(state.tier_id) : null, reason: state.reason.trim() } }, { onSuccess: () => { void refreshAll(); notify.success("Buyer tier updated") }, onError: e => notify.error(e.message) })}>Apply</Button></div>{buyer.override_reason ? <p className="mt-1 text-[11px] text-muted-foreground">Last reason: {buyer.override_reason}</p> : null}</td></tr>
          })}</tbody></table></div>
          {!buyers.length ? <div className="py-8 text-center text-sm text-muted-foreground">{buyersQuery.isError ? "Buyer accounts could not be loaded." : "No buyers match this search."}</div> : null}
           {buyersQuery.data?.meta ? <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>Page {buyersQuery.data.meta.current_page ?? buyerPage} of {buyersQuery.data.meta.last_page ?? 1} · {buyersQuery.data.meta.total ?? buyers.length} buyer accounts</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={buyerPage <= 1 || buyersQuery.isFetching} onClick={() => setBuyerPage(page => Math.max(1, page - 1))}><ChevronLeft className="mr-1 h-3.5 w-3.5" />Previous</Button><Button size="sm" variant="outline" disabled={buyerPage >= (buyersQuery.data.meta.last_page ?? 1) || buyersQuery.isFetching} onClick={() => setBuyerPage(page => page + 1)}>Next<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></div></div> : null}
        </CardContent></Card>
        <p className="text-xs text-muted-foreground">Tier discounts are configured here; buyer prices are calculated and returned by the server. Payment-term benefits remain subject to staff approval. No physical fulfilment is initiated by reward activation.</p>
      </>}
    </div>
  </AdminLayout>
}
