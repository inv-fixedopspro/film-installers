import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  getImpressionsByDateRange,
  getClicksByDateRange,
  getCTRByCampaign,
  getCTRBySlot,
  getSlotFillRate,
  getCampaignPerformanceSummary,
  getRevenueByPeriod,
} from "@/lib/db/ad-analytics";

export const GET = createAdminRoute(async ({ request }) => {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");
  const groupBy = url.searchParams.get("group_by") as "campaign" | "slot" | null;
  const granularity = (url.searchParams.get("granularity") as "day" | "week" | "month") || "month";

  if (!startDate || !endDate) {
    return errorResponse("start_date and end_date are required", 400);
  }

  const dateRange = { startDate, endDate };

  const [
    impressionsResult,
    clicksResult,
    ctrResult,
    slotFillResult,
    performanceResult,
    revenueResult,
  ] = await Promise.all([
    getImpressionsByDateRange(dateRange),
    getClicksByDateRange(dateRange),
    groupBy === "slot" ? getCTRBySlot(dateRange) : getCTRByCampaign(dateRange),
    getSlotFillRate(),
    getCampaignPerformanceSummary(dateRange),
    getRevenueByPeriod(dateRange, granularity),
  ]);

  const totalImpressions = impressionsResult.data.length;
  const totalClicks = clicksResult.data.length;
  const overallCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  return successResponse({
    summary: {
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      overall_ctr: overallCtr,
    },
    ctr_breakdown: ctrResult.data,
    slot_fill_rates: slotFillResult.data,
    campaign_performance: performanceResult.data,
    revenue: revenueResult.data,
    date_range: dateRange,
    granularity,
  });
});
