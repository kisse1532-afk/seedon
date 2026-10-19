import { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { categories, fetchPrograms, statusLabel, type Category, type Program } from "./src/data";

/* 씨드온 앱 뼈대 (인계함 2026.10.16 · 10.18 로드 "최대한 빨리").
   지금 들어 있는 것: 카드 목록 · 검색 · 칸(카테고리) 고르기 · 카드 열어보기.
   일부러 아직 안 넣은 것: 로그인 · 저장 · 신청 · 알림 — 웹과 똑같이 동작하는지
   로드 폰에서 먼저 보고 붙인다. 화면 이동은 라이브러리 없이 상태 하나로 한다
   (뼈대 단계라 가볍게). */

const C = {
  bg: "#FAF8F5",
  ink: "#1F1F1F",
  sub: "#6B6B6B",
  line: "#E7E2DA",
  accent: "#2F7D5B",
  tile: "#FFFFFF",
  warn: "#B4532A",
};

export default function App() {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [open, setOpen] = useState<Program | null>(null);

  const load = () => {
    setLoadError(false);
    fetchPrograms()
      .then(setPrograms)
      .catch(() => setLoadError(true));
  };
  useEffect(load, []);

  // 안드로이드 뒤로가기: 카드를 보고 있으면 목록으로
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (open) {
        setOpen(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [open]);

  const shown = useMemo(() => {
    if (!programs) return [];
    const q = query.trim().toLowerCase();
    return programs.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (!q) return true;
      return [p.title, p.org, p.description, ...(p.tags ?? [])].join(" ").toLowerCase().includes(q);
    });
  }, [programs, query, cat]);

  if (open) return <Detail program={open} onBack={() => setOpen(null)} />;

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <Text style={s.brand}>씨드온</Text>
        <Text style={s.lead}>이미 있는 지원, 눈치 보지 말고 찾아봐요</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="예: 학원비, 상담, 진로 체험"
          placeholderTextColor={C.sub}
          style={s.search}
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <Chip label="전체" active={cat === null} onPress={() => setCat(null)} />
          {categories.map((c) => (
            <Chip
              key={c.slug}
              label={`${c.emoji} ${c.label}`}
              active={cat === c.slug}
              onPress={() => setCat(cat === c.slug ? null : c.slug)}
            />
          ))}
        </ScrollView>
      </View>

      {loadError ? (
        <View style={s.center}>
          <Text style={s.sub}>지금은 목록을 못 불러왔어요.</Text>
          <Pressable onPress={load} style={s.retry}>
            <Text style={s.retryText}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : !programs ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(p) => p.id}
          contentContainerStyle={s.list}
          ListHeaderComponent={<Text style={s.count}>{shown.length}개 있어요</Text>}
          ListEmptyComponent={
            <Text style={s.empty}>
              딱 맞는 게 아직 없어요. 다른 말로 찾아보거나, 청소년전화 1388에 물어봐도 돼요.
            </Text>
          }
          renderItem={({ item }) => <Card program={item} onPress={() => setOpen(item)} />}
        />
      )}
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.chipText, active && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/* 카드에는 이름·기관·설명만 (절대규칙 1 — 대상 조건은 카드에 라벨로 붙이지 않는다) */
function Card({ program: p, onPress }: { program: Program; onPress: () => void }) {
  const label = statusLabel(p);
  const cat = categories.find((c) => c.slug === p.category);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}>
      <View style={s.cardTop}>
        <Text style={s.cardCat}>
          {cat?.emoji} {cat?.label}
        </Text>
        {label ? <Text style={[s.badge, p.reopen_note ? s.badgeClosed : null]}>{label}</Text> : null}
      </View>
      <Text style={s.cardTitle}>{p.title}</Text>
      <Text style={s.cardOrg}>{p.org}</Text>
      <Text style={s.cardDesc} numberOfLines={2}>
        {p.description}
      </Text>
    </Pressable>
  );
}

function Detail({ program: p, onBack }: { program: Program; onBack: () => void }) {
  const label = statusLabel(p);
  const linkText = p.apply_link_label || (p.link_kind === "info" ? "안내 페이지 열기" : "신청 페이지 열기");
  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="dark" />
      <Pressable onPress={onBack} style={s.back}>
        <Text style={s.backText}>← 목록으로</Text>
      </Pressable>
      <ScrollView contentContainerStyle={s.detail}>
        {label ? <Text style={[s.badge, s.badgeSolo, p.reopen_note ? s.badgeClosed : null]}>{label}</Text> : null}
        <Text style={s.detailTitle}>{p.title}</Text>
        <Text style={s.cardOrg}>{p.org}</Text>
        <Text style={s.detailDesc}>{p.description}</Text>

        {p.apply_steps && p.apply_steps.length > 0 ? (
          <View style={s.box}>
            <Text style={s.boxTitle}>이렇게 하면 돼요</Text>
            {p.apply_steps.map((st, i) => (
              <View key={i} style={s.step}>
                <Text style={s.stepIcon}>{st.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{st.title}</Text>
                  {st.subtitle ? <Text style={s.sub}>{st.subtitle}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {p.apply_method ? (
          <View style={s.box}>
            <Text style={s.boxTitle}>신청 방법</Text>
            <Text style={s.body}>{p.apply_method}</Text>
          </View>
        ) : null}

        {p.link ? (
          <Pressable onPress={() => Linking.openURL(p.link!)} style={s.primary}>
            <Text style={s.primaryText}>{linkText}</Text>
          </Pressable>
        ) : null}
        {p.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${p.phone!.replace(/[^0-9+]/g, "")}`)} style={s.secondary}>
            <Text style={s.secondaryText}>📞 {p.phone} 전화하기</Text>
          </Pressable>
        ) : null}

        <Text style={s.foot}>
          잘 모르겠으면 청소년전화 1388에 물어봐요. 1388만 누르면 되고, 언제든 돈 안 들어요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 8, gap: 8 },
  brand: { fontSize: 24, fontWeight: "800", color: C.accent },
  lead: { fontSize: 14, color: C.sub },
  search: {
    backgroundColor: C.tile,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.ink,
  },
  chips: { gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.tile },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 13, color: C.ink },
  chipTextOn: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  retry: { borderWidth: 1, borderColor: C.accent, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: C.accent, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  count: { fontSize: 13, color: C.sub, marginBottom: 4 },
  empty: { fontSize: 14, color: C.sub, lineHeight: 21, paddingVertical: 24 },
  card: { backgroundColor: C.tile, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 16, gap: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardCat: { fontSize: 12, color: C.sub },
  badge: { fontSize: 11, color: C.accent, backgroundColor: "#E8F3EE", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
  badgeClosed: { color: C.warn, backgroundColor: "#F8ECE5" },
  badgeSolo: { alignSelf: "flex-start" },
  cardTitle: { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 2 },
  cardOrg: { fontSize: 13, color: C.sub },
  cardDesc: { fontSize: 14, color: C.ink, lineHeight: 20, marginTop: 4 },
  back: { paddingHorizontal: 16, paddingTop: 44, paddingBottom: 8 },
  backText: { fontSize: 15, color: C.accent, fontWeight: "600" },
  detail: { padding: 16, gap: 10, paddingBottom: 48 },
  detailTitle: { fontSize: 22, fontWeight: "800", color: C.ink },
  detailDesc: { fontSize: 15, color: C.ink, lineHeight: 23 },
  box: { backgroundColor: C.tile, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 },
  boxTitle: { fontSize: 15, fontWeight: "700", color: C.ink },
  step: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  stepIcon: { fontSize: 20 },
  stepTitle: { fontSize: 14, fontWeight: "600", color: C.ink },
  body: { fontSize: 14, color: C.ink, lineHeight: 21 },
  sub: { fontSize: 13, color: C.sub, lineHeight: 19 },
  primary: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondary: { borderWidth: 1, borderColor: C.accent, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  secondaryText: { color: C.accent, fontSize: 15, fontWeight: "600" },
  foot: { fontSize: 12, color: C.sub, lineHeight: 18, marginTop: 12 },
});
