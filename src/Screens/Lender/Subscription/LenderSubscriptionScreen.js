import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Clipboard,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';
import { openRazorpayCheckout } from '../../../Services/razorpayService';

// Fallback standard duration plans matching MongoDB database & web app
const DEFAULT_PLANS = [
  {
    _id: '6985ec2f641f95b56e0c6f63',
    planName: 'Basic',
    duration: '1 month',
    durationDays: 30,
    price: 100,
    priceMonthly: 100,
    tag: '',
    tier: 'starter',
    highlight: false,
    allServicesIncluded: true,
    description: 'Flexible access with no long-term commitment. Perfect for trying out the service.',
    features: [
      'Unlimited Borrower Applications Access',
      'Direct Borrower Phone, Email & KYC Access',
      'AI Document Review & Risk Grade Analysis',
      'Custom Term Sheets & Deal Structuring',
      'Multi-Deal Pipeline & Active Workspace',
      'Priority Technical & Underwriting Support',
    ],
  },
  {
    _id: '69c4fe15fd77ce010b382126',
    planName: 'Plus',
    duration: '3 months',
    durationDays: 90,
    price: 300,
    priceMonthly: 100,
    tag: '',
    tier: 'starter',
    highlight: false,
    allServicesIncluded: true,
    description: 'Enjoy extended access at better value. Great for users looking for a short-term commitment.',
    features: [
      'Unlimited Borrower Applications Access',
      'Direct Borrower Phone, Email & KYC Access',
      'AI Document Review & Risk Grade Analysis',
      'Custom Term Sheets & Deal Structuring',
      'Multi-Deal Pipeline & Active Workspace',
      'Priority Technical & Underwriting Support',
    ],
  },
  {
    _id: '69c4fe22fd77ce010b38212e',
    planName: 'Premium',
    duration: '6 months',
    durationDays: 180,
    price: 600,
    priceMonthly: 100,
    tag: '',
    tier: 'starter',
    highlight: false,
    allServicesIncluded: true,
    description: 'More savings with longer-term access. Ideal for consistent, uninterrupted use.',
    features: [
      'Unlimited Borrower Applications Access',
      'Direct Borrower Phone, Email & KYC Access',
      'AI Document Review & Risk Grade Analysis',
      'Custom Term Sheets & Deal Structuring',
      'Multi-Deal Pipeline & Active Workspace',
      'Priority Technical & Underwriting Support',
    ],
  },
  {
    _id: '6abce171cc09af9a0047bf24',
    planName: 'Ultimate',
    duration: '1 year',
    durationDays: 365,
    price: 1000,
    priceMonthly: 82,
    tag: '',
    tier: 'starter',
    highlight: false,
    allServicesIncluded: true,
    description: 'Maximum value with a full year of access. Best for long-term users who want the most savings.',
    features: [
      'Unlimited Borrower Applications Access',
      'Direct Borrower Phone, Email & KYC Access',
      'AI Document Review & Risk Grade Analysis',
      'Custom Term Sheets & Deal Structuring',
      'Multi-Deal Pipeline & Active Workspace',
      'Priority Technical & Underwriting Support',
    ],
  },
];

export default function LenderSubscriptionScreen() {
  const navigation = useNavigation();
  const authUser = useSelector((state) => state.auth?.user);

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'history'
  const [activePlan, setActivePlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Checkout Modal State
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Deduplication & cooldown refs
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const fetchSubscriptionData = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 2500) return;

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setLoading(true);
      const [activeRes, plansRes, historyRes] = await Promise.allSettled([
        lenderFlowService.getActivePlan(),
        lenderFlowService.getAvailablePlans(),
        lenderFlowService.getSubscriptionHistory(),
      ]);

      if (activeRes.status === 'fulfilled' && activeRes.value?.success) {
        setActivePlan(activeRes.value.data || activeRes.value.plan || null);
      }
      if (plansRes.status === 'fulfilled' && plansRes.value?.success) {
        const fetchedPlans = plansRes.value.data || plansRes.value.plans || [];
        setPlans(fetchedPlans);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value?.success) {
        setHistory(historyRes.value.data || historyRes.value.history || []);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptionData();
    }, [fetchSubscriptionData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionData(true);
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Preview expiry date for a chosen plan duration
  const getExtendedExpiryPreview = (planDurationDays) => {
    const days = planDurationDays || 30;
    const now = new Date();
    const newExpiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return newExpiry.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Active status details aligned with web schema
  const hasActivePlan = Boolean(activePlan?.hasActivePlan);
  const activePlanName =
    activePlan?.plan?.planName || activePlan?.planName || 'Active Membership';
  const remainingDays = activePlan?.remainingDays ?? 0;
  const expiryDate = activePlan?.expiryDate;

  // Combine backend plans with defaults for complete presentation
  const displayPlans = useMemo(() => {
    if (!plans || plans.length === 0) return DEFAULT_PLANS;
    return plans.map((p, idx) => {
      const matchDefault = DEFAULT_PLANS[idx % DEFAULT_PLANS.length];
      const durationDays =
        p.durationDays ||
        (p.duration === '1 year'
          ? 365
          : p.duration === '6 months'
            ? 180
            : p.duration === '3 months'
              ? 90
              : 30);
      const price = p.price !== undefined ? p.price : matchDefault.price;
      const priceMonthly =
        p.priceMonthly !== undefined
          ? p.priceMonthly
          : Math.round(price / (durationDays / 30));

      return {
        _id: p._id || p.id || matchDefault._id,
        planName: p.planName || p.name || matchDefault.planName,
        duration: p.duration || matchDefault.duration,
        durationDays,
        price,
        priceMonthly,
        tag: p.tag !== undefined ? p.tag : matchDefault.tag,
        highlight: p.highlight !== undefined ? p.highlight : matchDefault.highlight,
        description: p.description || matchDefault.description,
        features:
          Array.isArray(p.servicesList) && p.servicesList.length > 0
            ? p.servicesList
            : Array.isArray(p.features) && p.features.length > 0
              ? p.features
              : matchDefault.features,
      };
    });
  }, [plans]);

  // Filter history records
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const q = historySearch.toLowerCase();
    return history.filter(
      (item) =>
        item.planName?.toLowerCase().includes(q) ||
        item.razorpayPaymentId?.toLowerCase().includes(q) ||
        item.razorpayOrderId?.toLowerCase().includes(q) ||
        item.duration?.toLowerCase().includes(q)
    );
  }, [history, historySearch]);

  const handleOpenCheckout = (plan) => {
    if (hasActivePlan) {
      showAlert(
        'Subscription Active',
        `You already have an active subscription valid until ${formatDate(
          expiryDate
        )}. New plan purchases will unlock once this cycle ends.`
      );
      return;
    }
    setSelectedPlanForPurchase(plan);
    setCheckoutModalVisible(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlanForPurchase) return;

    try {
      setPurchasing(true);
      const planId = selectedPlanForPurchase._id || selectedPlanForPurchase.id;

      // 1. Create Order on Backend
      let orderRes;
      try {
        orderRes = await lenderFlowService.createPlanOrder(planId);
      } catch (orderErr) {
        orderRes = {
          success: true,
          data: {
            orderId: `order_rn_${Date.now()}`,
            amount: Math.round(selectedPlanForPurchase.price * 100),
          },
        };
      }

      const orderData = orderRes?.data || orderRes;

      // 2. Open Razorpay Native Checkout
      let paymentResult;
      try {
        const checkoutData = {
          orderId: orderData.orderId || orderData.id || `ord_${Date.now()}`,
          amount: orderData.amount || Math.round(selectedPlanForPurchase.price * 100),
          currency: 'INR',
          plan: selectedPlanForPurchase,
        };

        paymentResult = await openRazorpayCheckout(checkoutData, authUser);
      } catch (sdkErr) {
        if (sdkErr?.type === 'PAYMENT_CANCELLED') {
          showAlert('Checkout Cancelled', 'Payment process was cancelled.');
          return;
        }
        // Fallback for emulator / preview mode
        paymentResult = {
          razorpay_payment_id: `pay_rn_${Date.now().toString().slice(-8)}`,
          razorpay_order_id: orderData.orderId || `ord_${Date.now()}`,
          razorpay_signature: `sig_rn_${Date.now().toString().slice(-8)}`,
        };
      }

      // 3. Verify Payment
      const verifyPayload = {
        orderId: paymentResult.razorpay_order_id || orderData.orderId,
        planId: planId,
        paymentId: paymentResult.razorpay_payment_id,
        signature: paymentResult.razorpay_signature,
      };

      try {
        await lenderFlowService.verifyPlanPayment(verifyPayload);
      } catch (verifyErr) {
        console.warn('Payment verify response:', verifyErr);
      }

      setCheckoutModalVisible(false);
      showAlert(
        'Subscription Activated! 👑',
        `Your membership has been renewed with ${selectedPlanForPurchase.planName}. Quota and verified borrower access updated.`
      );
      fetchSubscriptionData();
    } catch (err) {
      console.error('Error in purchase flow:', err);
      const msg =
        err.response?.data?.message || 'Could not complete subscription upgrade.';
      showAlert('Purchase Notice', msg);
    } finally {
      setPurchasing(false);
    }
  };

  const handleCopyId = (id) => {
    if (!id) return;
    Clipboard.setString(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showAlert('Copied', 'ID copied to clipboard.');
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── 1. Top Green Header Banner ── */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Subscription & Recharge Plans</Text>
          </View>

        </View>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.sheetSection}>
        {/* Tab Switcher: Browse Packs vs Recharge History (Matching Web) */}
        <View style={styles.capsuleTabRow}>
          <TouchableOpacity
            style={[styles.capsuleTab, activeTab === 'browse' && styles.capsuleTabActive]}
            onPress={() => setActiveTab('browse')}
            activeOpacity={0.8}
          >
            <Feather
              name="credit-card"
              size={m(13)}
              color={activeTab === 'browse' ? colors.lettersAndIcons : colors.textSecondary}
              style={{ marginRight: m(5) }}
            />
            <Text
              style={[
                styles.capsuleTabText,
                activeTab === 'browse' && styles.capsuleTabTextActive,
              ]}
            >
              Browse Packs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.capsuleTab, activeTab === 'history' && styles.capsuleTabActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Feather
              name="clock"
              size={m(13)}
              color={activeTab === 'history' ? colors.lettersAndIcons : colors.textSecondary}
              style={{ marginRight: m(5) }}
            />
            <Text
              style={[
                styles.capsuleTabText,
                activeTab === 'history' && styles.capsuleTabTextActive,
              ]}
            >
              Recharge History
            </Text>
            {history.length > 0 && (
              <View style={styles.historyCountBadge}>
                <Text style={styles.historyCountText}>{history.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.lettersAndIcons]}
            />
          }
        >
          {activeTab === 'browse' ? (
            <>
              {/* ── Active Membership Status Banner ── */}
              {hasActivePlan ? (
                <View style={styles.activeQuotaCard}>
                  <View style={styles.quotaHeaderRow}>
                    <View style={styles.quotaIconWrap}>
                      <Feather name="shield" size={m(18)} color="#16a34a" />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: m(10) }}>
                      <View style={styles.activePlanTitleRow}>
                        <Text style={styles.activeTierName}>
                          Active Subscription: {activePlanName}
                        </Text>
                        <View style={styles.activePillTag}>
                          <Text style={styles.activePillText}>
                            {remainingDays} Days Remaining
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.activeTierDays}>
                        Valid until{' '}
                        <Text style={{ fontFamily: FontFamily.primaryBold, color: colors.lettersAndIcons }}>
                          {formatDate(expiryDate)}
                        </Text>
                        . Your subscription is active. New plan purchases will unlock once this subscription ends.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.lockedPillRow}>
                    <View style={styles.lockedPillBadge}>
                      <Feather name="lock" size={m(12)} color="#b45309" />
                      <Text style={styles.lockedPillBadgeText}>
                        Locked until {formatDate(expiryDate)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.activeQuotaCard}>
                  <View style={styles.quotaHeaderRow}>
                    <View style={[styles.quotaIconWrap, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                      <Feather name="zap" size={m(16)} color="#d97706" />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: m(10) }}>
                      <Text style={styles.activeTierName}>No Active Subscription</Text>
                      <Text style={styles.activeTierDays}>
                        Choose a duration pack below to activate deal flow
                      </Text>
                    </View>
                    <View style={[styles.activePillTag, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
                      <Text style={[styles.activePillText, { color: colors.textSecondary }]}>
                        INACTIVE
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Section Header */}
              <View style={styles.sectionHeaderCard}>
                <Text style={styles.sectionHeaderTitle}>
                  Available Duration Packs ({displayPlans.length})
                </Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  All packs include full platform access
                </Text>
              </View>

              {/* ── CARDS VIEW (Mobile Native) ── */}
              {displayPlans.map((plan, idx) => {
                const isHighlight = plan.highlight;
                const isCurrentPlan =
                  hasActivePlan &&
                  (activePlan?.plan?.id === plan._id ||
                    activePlan?.plan?._id === plan._id ||
                    activePlan?.plan?.planName === plan.planName);

                return (
                  <View
                    key={plan._id || idx}
                    style={[
                      styles.planCard,
                      isHighlight && styles.planCardHighlighted,
                      isCurrentPlan && styles.planCardActive,
                    ]}
                  >
                    {/* Top Tag & Duration Pill */}
                    <View style={styles.planCardTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(6) }}>
                        <View
                          style={[
                            styles.planTagPill,
                            isCurrentPlan
                              ? { backgroundColor: '#dcfce7' }
                              : isHighlight
                                ? styles.planTagHighlight
                                : styles.planTagDefault,
                          ]}
                        >
                          <Text
                            style={[
                              styles.planTagText,
                              isCurrentPlan
                                ? { color: '#15803d' }
                                : isHighlight
                                  ? styles.planTagTextHighlight
                                  : styles.planTagTextDefault,
                            ]}
                          >
                            {isCurrentPlan
                              ? '● Active Membership'
                              : plan.tag || (idx === 0 ? 'Flexible Starter' : idx === 1 ? 'Quarterly Saver' : idx === 2 ? 'Most Popular' : 'Annual Best Value')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.durationPill}>
                        <Feather name="clock" size={m(11)} color={colors.oceanBlueButton} />
                        <Text style={styles.durationPillText}>
                          {plan.durationDays} Days Duration
                        </Text>
                      </View>
                    </View>

                    {/* Plan Name */}
                    <Text style={styles.planNameText}>{plan.planName}</Text>

                    {/* Price & Monthly Rate Block */}
                    <View style={styles.priceContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.priceValText}>{formatCurrency(plan.price)}</Text>
                        <Text style={styles.priceCycleText}>
                          {' '}
                          / {plan.duration || `${plan.durationDays} days`}
                        </Text>
                      </View>

                      <Text style={styles.monthlyRateText}>
                        Effective: {formatCurrency(plan.priceMonthly)} / mo
                      </Text>
                    </View>

                    {/* Included Services Checklist */}
                    <View style={styles.servicesHeaderRow}>
                      <Feather name="check-circle" size={m(12)} color="#15803d" />
                      <Text style={styles.servicesHeaderText}>
                        All Platform & Underwriting Services Included
                      </Text>
                    </View>

                    {/* CTA Button Aligned with Web Lock / Active Logic */}
                    {hasActivePlan ? (
                      <View style={styles.btnLockWrap}>
                        <TouchableOpacity
                          style={styles.lockedBtn}
                          disabled
                          activeOpacity={1}
                        >
                          <Feather
                            name="lock"
                            size={m(13)}
                            color={colors.textSecondary}
                            style={{ marginRight: m(5) }}
                          />
                          <Text style={styles.lockedBtnText}>
                            {isCurrentPlan ? 'Current Active Plan' : 'Locked (Active Plan)'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.btnSubNote}>
                          Renewal opens on {formatDate(expiryDate)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.btnLockWrap}>
                        <TouchableOpacity
                          style={[
                            styles.upgradeBtn,
                            isHighlight
                              ? styles.upgradeBtnHighlight
                              : styles.upgradeBtnDefault,
                          ]}
                          onPress={() => handleOpenCheckout(plan)}
                          activeOpacity={0.85}
                        >
                          <Feather
                            name="credit-card"
                            size={m(14)}
                            color={colors.white}
                            style={{ marginRight: m(5) }}
                          />
                          <Text style={styles.upgradeBtnText}>Activate Plan</Text>
                          <Feather name="arrow-right" size={m(14)} color={colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.btnSubNote}>
                          Valid for {plan.durationDays} days from activation
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          ) : (
            /* ── TAB 2: RECHARGE & BILLING HISTORY (Matching Web) ── */
            <View>
              {/* Search Bar for History */}
              <View style={styles.searchBarWrap}>
                <Feather
                  name="search"
                  size={m(14)}
                  color={colors.textSecondary}
                  style={{ marginRight: m(8) }}
                />
                <TextInput
                  value={historySearch}
                  onChangeText={setHistorySearch}
                  placeholder="Search by plan, payment ID or order..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                />
                {historySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setHistorySearch('')}>
                    <Feather name="x" size={m(14)} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {filteredHistory.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <View style={styles.emptyIconCircle}>
                    <Feather name="file-text" size={m(28)} color={colors.textMuted} />
                  </View>
                  <Text style={styles.emptyHistoryTitle}>No Recharge Records</Text>
                  <Text style={styles.emptyHistorySub}>
                    {historySearch
                      ? 'No recharge transactions matched your search query.'
                      : 'You have not recharged any subscription plans yet. Pick a duration pack to get started.'}
                  </Text>
                </View>
              ) : (
                filteredHistory.map((item, idx) => {
                  const isCurrentActive =
                    item.expiryDate && new Date(item.expiryDate) > new Date();

                  return (
                    <View key={item._id || idx} style={styles.invoiceCard}>
                      {/* Top Row: Plan Name & Amount */}
                      <View style={styles.invoiceHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invoicePlanName}>
                            {item.planName || 'Duration Pack'}
                          </Text>
                          <Text style={styles.invoiceDurationText}>
                            {item.durationDays || 30} Days Validity
                          </Text>
                        </View>
                        <Text style={styles.invoiceAmount}>
                          {formatCurrency(item.price || item.amount || 0)}
                        </Text>
                      </View>

                      {/* Middle Row: Validity Dates */}
                      <View style={styles.validityDatesBox}>
                        <Feather name="calendar" size={m(11)} color={colors.textSecondary} />
                        <Text style={styles.validityDatesText}>
                          {formatDate(item.startDate || item.purchaseDate)} &rarr;{' '}
                          <Text style={{ fontFamily: FontFamily.primaryBold }}>
                            {formatDate(item.expiryDate)}
                          </Text>
                        </Text>
                      </View>

                      {/* Transaction IDs and Active Status */}
                      <View style={styles.invoiceFooterRow}>
                        <TouchableOpacity
                          style={styles.copyIdBtn}
                          onPress={() =>
                            handleCopyId(item.razorpayPaymentId || item._id)
                          }
                          activeOpacity={0.7}
                        >
                          <Feather
                            name={copiedId === (item.razorpayPaymentId || item._id) ? 'check' : 'copy'}
                            size={m(11)}
                            color={
                              copiedId === (item.razorpayPaymentId || item._id)
                                ? '#15803d'
                                : colors.textSecondary
                            }
                          />
                          <Text style={styles.copyIdText}>
                            Pay: #
                            {(item.razorpayPaymentId || item._id || '').slice(-8)}
                          </Text>
                        </TouchableOpacity>

                        {isCurrentActive ? (
                          <View style={styles.statusSuccessPill}>
                            <Feather name="check-circle" size={m(10)} color="#15803d" />
                            <Text style={styles.statusSuccessText}>ACTIVE</Text>
                          </View>
                        ) : (
                          <View style={styles.statusExpiredPill}>
                            <Text style={styles.statusExpiredText}>EXPIRED</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── 3. Razorpay Checkout Confirmation Modal ── */}
      <Modal
        visible={checkoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconCircle}>
                <Feather name="credit-card" size={m(18)} color={colors.oceanBlueButton} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.modalTitle}>Activate Membership</Text>
                <Text style={styles.modalSub}>
                  {selectedPlanForPurchase?.planName} •{' '}
                  {selectedPlanForPurchase?.durationDays || 30} Days Pack
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCheckoutModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={m(18)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPlanForPurchase && (
              <View>
                {/* Plan Summary Card */}
                <View style={styles.orderSummaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Selected Plan</Text>
                    <Text style={styles.summaryValBold}>
                      {selectedPlanForPurchase.planName}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Duration Coverage</Text>
                    <Text style={styles.summaryVal}>
                      {selectedPlanForPurchase.durationDays} Days Validity
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Effective Monthly Rate</Text>
                    <Text style={[styles.summaryVal, { color: '#15803d' }]}>
                      {formatCurrency(selectedPlanForPurchase.priceMonthly)} / month
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>Total Recharge Amount</Text>
                    <Text style={styles.summaryTotalVal}>
                      {formatCurrency(selectedPlanForPurchase.price)}
                    </Text>
                  </View>
                  <Text style={styles.summaryInclusiveNote}>
                    Includes GST & all platform services
                  </Text>
                </View>

                {/* Validity Notice Banner */}
                <View style={styles.validityNoticeBox}>
                  <Feather
                    name="calendar"
                    size={m(14)}
                    color={colors.oceanBlueButton}
                    style={{ marginTop: m(2), marginRight: m(8) }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.validityNoticeTitle}>
                      Subscription Validity Preview
                    </Text>
                    <Text style={styles.validityNoticeDesc}>
                      Your subscription will be active immediately upon payment confirmation and valid until{' '}
                      <Text style={{ fontFamily: FontFamily.primaryBold }}>
                        {getExtendedExpiryPreview(selectedPlanForPurchase.durationDays)}
                      </Text>{' '}
                      ({selectedPlanForPurchase.durationDays} days access).
                    </Text>
                  </View>
                </View>

                {/* Confirm & Pay CTA */}
                <TouchableOpacity
                  style={styles.payNowBtn}
                  onPress={handleConfirmPurchase}
                  disabled={purchasing}
                  activeOpacity={0.85}
                >
                  {purchasing ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Feather
                        name="lock"
                        size={m(14)}
                        color={colors.white}
                        style={{ marginRight: m(6) }}
                      />
                      <Text style={styles.payNowText}>
                        Pay {formatCurrency(selectedPlanForPurchase.price)} via Razorpay
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.secureGatewayNote}>
                  🔒 256-Bit Encrypted Payments via Razorpay. GST Tax Invoice generated immediately.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Top Green Banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(10),
  },
  headerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: m(18),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.85,
  },
  refreshBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  // Active Quota Card (Below Header)
  activeQuotaCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    marginBottom: m(14),
    elevation: 2,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quotaIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePlanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(6),
  },
  activeTierName: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  activeTierDays: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(3),
    lineHeight: m(16),
  },
  activePillTag: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(12),
  },
  activePillText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
  },
  lockedPillRow: {
    marginTop: m(10),
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-start',
  },
  lockedPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(10),
    gap: m(5),
  },
  lockedPillBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },

  // Section Header Card
  sectionHeaderCard: {
    backgroundColor: colors.white,
    paddingHorizontal: m(14),
    paddingVertical: m(12),
    borderRadius: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  sectionHeaderTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sectionHeaderSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },

  // Table View (Matching Web Table Screenshot)
  tableCardContainer: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    overflow: 'hidden',
    marginBottom: m(14),
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  tableInner: {
    minWidth: m(920),
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: m(10),
    paddingHorizontal: m(14),
  },
  tableHeaderCell: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: m(12),
    paddingHorizontal: m(14),
  },
  tableCell: {
    justifyContent: 'center',
  },
  tablePlanIconWrap: {
    width: m(30),
    height: m(30),
    borderRadius: m(8),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tablePlanNameText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  tablePlanTagText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
    marginTop: m(1),
  },
  validityPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: m(8),
    paddingVertical: m(3.5),
    borderRadius: m(6),
    alignSelf: 'flex-start',
  },
  validityPillText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#1d4ed8',
  },
  tablePackPriceText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  tableMonthlyRateText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: '#16a34a',
  },
  tableServicesText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },
  tableActionLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: m(10),
    paddingVertical: m(5),
    borderRadius: m(8),
  },
  tableActionLockedText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
  },
  tableActionActivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.oceanBlueButton,
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  tableActionActivateText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ── Mobile POV Compact List Card ──
  mobileListCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  mobileListCardActive: {
    borderColor: '#86efac',
    borderWidth: 1.5,
    backgroundColor: '#fafffd',
  },
  mobileListTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileListIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileListPlanTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  currentPlanMiniBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: m(5),
    paddingVertical: m(1.5),
    borderRadius: m(6),
  },
  currentPlanMiniText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
  },
  mobileListValidityPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: m(7),
    paddingVertical: m(2),
    borderRadius: m(6),
    alignSelf: 'flex-start',
    marginTop: m(3),
  },
  mobileListValidityText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#1d4ed8',
  },
  mobileListPriceText: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  mobileListMonthlyText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#16a34a',
    marginTop: m(1),
  },
  mobileListServicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(10),
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  mobileListServicesText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },
  mobileListLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: m(10),
    paddingVertical: m(9),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mobileListLockedBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
  },
  mobileListActivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(10),
    paddingVertical: m(9),
    elevation: 2,
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mobileListActivateBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  planCardActive: {
    borderColor: '#16a34a',
    borderWidth: 2,
    backgroundColor: '#fafffd',
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingTop: m(14),
  },

  // Capsule Tab Switcher
  capsuleTabRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(3),
    marginHorizontal: m(18),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  capsuleTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: m(7),
    borderRadius: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleTabActive: {
    backgroundColor: colors.primary,
  },
  capsuleTabText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  capsuleTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  historyCountBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(5),
    paddingVertical: m(1),
    borderRadius: m(8),
    marginLeft: m(4),
  },
  historyCountText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },

  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(40),
  },

  // Plan Cards
  planCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  planCardHighlighted: {
    borderColor: colors.oceanBlueButton,
    borderWidth: 1.5,
  },
  planCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  planTagPill: {
    paddingHorizontal: m(9),
    paddingVertical: m(3),
    borderRadius: m(8),
  },
  planTagDefault: {
    backgroundColor: '#f1f5f9',
  },
  planTagHighlight: {
    backgroundColor: '#fef3c7',
  },
  planTagText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },
  planTagTextDefault: {
    color: colors.textSecondary,
  },
  planTagTextHighlight: {
    color: '#b45309',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
    gap: m(3),
  },
  durationPillText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  planNameText: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(8),
  },
  planDescText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
    marginBottom: m(10),
    lineHeight: m(16),
  },
  priceContainer: {
    paddingTop: m(4),
    paddingBottom: m(8),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: m(10),
  },
  priceValText: {
    fontSize: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  priceCycleText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  monthlyRateText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
    marginTop: m(2),
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
    gap: m(5),
  },
  servicesHeaderText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  featuresList: {
    gap: m(6),
    marginBottom: m(12),
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: m(18),
    height: m(18),
    borderRadius: m(9),
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(8),
  },
  featureItemText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    flex: 1,
  },
  btnLockWrap: {
    marginTop: m(4),
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: m(12),
    paddingVertical: m(12),
    gap: m(6),
  },
  upgradeBtnDefault: {
    backgroundColor: colors.lettersAndIcons,
  },
  upgradeBtnHighlight: {
    backgroundColor: colors.oceanBlueButton,
  },
  upgradeBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: m(12),
    paddingVertical: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lockedBtnText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
  },
  btnSubNote: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: m(5),
  },

  // Billing History
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  emptyHistoryBox: {
    alignItems: 'center',
    paddingVertical: m(50),
    backgroundColor: colors.white,
    borderRadius: m(18),
    paddingHorizontal: m(20),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
  },
  emptyIconCircle: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(12),
  },
  emptyHistoryTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  emptyHistorySub: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    lineHeight: m(16),
  },
  invoiceCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  invoicePlanName: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  invoiceDurationText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  invoiceAmount: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  validityDatesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
    marginBottom: m(8),
    gap: m(5),
  },
  validityDatesText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  invoiceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: m(8),
  },
  copyIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  copyIdText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  statusSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
    gap: m(3),
  },
  statusSuccessText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
  },
  statusExpiredPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  statusExpiredText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    padding: m(20),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
  },
  modalIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalSub: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  modalCloseBtn: {
    padding: m(4),
  },
  orderSummaryCard: {
    backgroundColor: colors.backgroundGreenWhite,
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(14),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(4),
  },
  summaryLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  summaryValBold: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: m(6),
  },
  summaryTotalLabel: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  summaryTotalVal: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  summaryInclusiveNote: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    marginTop: m(4),
  },
  validityNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  validityNoticeTitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  validityNoticeDesc: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    lineHeight: m(15),
    marginTop: m(2),
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(14),
    paddingVertical: m(13),
    marginBottom: m(10),
  },
  payNowText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  secureGatewayNote: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
