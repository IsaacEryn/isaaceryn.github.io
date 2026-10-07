"""results.jsonl을 규칙 단위로 묶어 도구별로 ACT 기대와 얼마나 맞는지 센다.

규칙 하나를 이렇게 나눈다 (W3C ACT 구현 보고서의 '일관됨(consistent)' 정의를 본뜬 근사. 성공 기준 보고 검사는 뺐다):
  일관됨      통과·해당 없음 예제를 실패로 판정한 적이 없고, 실패 예제는 모두 실패 또는 판단 보류로 냈으며,
              그중 하나 이상은 실패로 잡음
  부분        기대와 다른 실패 판정은 없지만 실패 예제 일부를 놓침(통과 처리)
  실패로 확정 못 함  기대와 다른 실패 판정은 없지만 실패 예제를 하나도 실패로 확정하지 못함(모두 판단 보류이거나 놓침)
  기대와 다름 통과·해당 없음 예제를 실패로 판정한 적이 있음
  꺼짐        대응 규칙은 있지만 기본 설정에서 실행되지 않음
  미구현      대응 규칙이 없음
W3C 보고서는 성공 기준 매핑까지 따지므로 이 집계와 숫자가 같을 필요는 없다.
"""
import json, collections

ALL = [json.loads(l) for l in open('results.jsonl')]
assert not [r for r in ALL if 'error' in r], '오류 케이스가 있습니다'
skipped = [r for r in ALL if 'skipped' in r]
R = [r for r in ALL if 'skipped' not in r]
for r in skipped: print('측정에서 뺌:', r['rule'], r['title'], r['skipped'])
names = {r['rule']: r['title'] for r in R}
rules = sorted({r['rule'] for r in R})
ORDER = ['일관됨', '부분', '실패로 확정 못 함', '기대와 다름', '꺼짐', '미구현']

def classify(tool, rs):
    st = rs[0][tool]['status']
    if st == 'unmapped': return '미구현', None
    if st == 'off': return '꺼짐', None
    failed = [r for r in rs if r['expected'] == 'failed']
    ok = [r for r in rs if r['expected'] != 'failed']
    o = lambda r: r[tool]['outcome']
    n = dict(failed=len(failed), caught=sum(o(r) == 'failed' for r in failed),
             cant=sum(o(r) == 'cantTell' for r in failed), missed=sum(o(r) == 'notFailed' for r in failed),
             ok=len(ok), wrong=sum(o(r) == 'failed' for r in ok), okCant=sum(o(r) == 'cantTell' for r in ok))
    if n['wrong']: c = '기대와 다름'
    elif n['missed'] == 0 and n['caught'] > 0: c = '일관됨'
    elif n['caught'] > 0: c = '부분'
    else: c = '실패로 확정 못 함'
    return c, n

print(f'규칙 {len(rules)}개, 테스트 케이스 {len(R)}개', collections.Counter(r['expected'] for r in R))
per = {}
for tool in ['axe', 'ibm']:
    cls = collections.Counter(); tot = collections.Counter(); per[tool] = {}
    for rid in rules:
        rs = [r for r in R if r['rule'] == rid]
        c, n = classify(tool, rs); cls[c] += 1; per[tool][rid] = (c, n)
        if n: tot.update(n)
    strict = sum(1 for c, n in per[tool].values() if n and n['wrong'] == 0 and n['caught'] == n['failed'])
    print(f'\n[{tool}]', {k: cls[k] for k in ORDER if cls[k]}, f'| 실패 예제를 모두 실패로 잡은 규칙 {strict}개')
    print(f'  실패 예제 {tot["failed"]}개: 실패 {tot["caught"]}, 판단 보류 {tot["cant"]}, 놓침 {tot["missed"]}')
    print(f'  통과·해당 없음 {tot["ok"]}개: 실패로 판정 {tot["wrong"]}, 판단 보류 {tot["okCant"]}')
    for rid, (c, n) in per[tool].items():
        if c not in ('일관됨',): print(f'   {rid} {c:6} {n}')
    for r in R:
        if r[tool].get('outcome') == 'failed' and r['expected'] != 'failed':
            print('   기대와 다름:', r['rule'], r['title'], r['expected'], r[tool]['failedBy'], r['url'].rsplit('/', 1)[-1][:10])
json.dump(per, open('per-rule.json', 'w'), ensure_ascii=False, indent=1)

both = [r for r in R if r['axe']['status'] == 'ran' and r['ibm']['status'] == 'ran']
f = lambda r, t: r[t]['outcome'] == 'failed'
dis = [r for r in both if f(r, 'axe') != f(r, 'ibm')]
print(f'\n두 도구 모두 실행된 규칙 {len({r["rule"] for r in both})}개, 케이스 {len(both)}개 중 실패 판정이 갈린 케이스 {len(dis)}개(규칙 {len({r["rule"] for r in dis})}개)')
pat = collections.Counter()
for r in dis:
    who = 'axe' if f(r, 'axe') else 'ibm'; other = 'ibm' if who == 'axe' else 'axe'
    right = '실패 판정이 맞음' if r['expected'] == 'failed' else '실패 판정이 틀림'
    pat[(f'{who}만 실패', f'상대는 {r[other]["outcome"]}', right)] += 1
for k, v in pat.most_common(): print('  ', v, k)
for r in dis: print('   ', r['rule'], r['title'], r['expected'], 'axe', r['axe']['outcome'], 'ibm', r['ibm']['outcome'])
same3 = sum(1 for r in both if r['axe']['outcome'] == r['ibm']['outcome'])
print(f'판단 보류까지 구분하면 {len(both)}개 중 {same3}개가 같은 답')
