"""results.jsonl을 규칙 단위로 묶어 도구별로 ACT 기대와 얼마나 맞는지 센다.

규칙 하나를 이렇게 나눈다 (W3C ACT 구현 보고서의 '일관됨(consistent)' 정의를 본뜬 근사. 성공 기준 보고 검사는 뺐다).
출력에는 영어 이름을 쓴다.
  consistent (일관됨)
      통과·해당 없음 예제를 실패로 판정한 적이 없고, 실패 예제는 모두 실패 또는 판단 보류로 냈으며, 그중 하나 이상은 실패로 잡음
  partial (부분)
      기대와 다른 실패 판정은 없지만 실패 예제 일부를 놓침(통과 처리)
  never confirmed a failure (실패로 확정 못 함)
      기대와 다른 실패 판정은 없지만 실패 예제를 하나도 실패로 확정하지 못함(모두 판단 보류이거나 놓침)
  differs from expectation (기대와 다름)
      통과·해당 없음 예제를 실패로 판정한 적이 있음
  off by default (꺼짐)
      대응 규칙은 있지만 기본 설정에서 실행되지 않음
  not implemented (미구현)
      대응 규칙이 없음
W3C 보고서는 성공 기준 매핑까지 따지므로 이 집계와 숫자가 같을 필요는 없다.
"""
import json, collections

ALL = [json.loads(l) for l in open('results.jsonl')]
assert not [r for r in ALL if 'error' in r], 'results.jsonl contains errored test cases'
skipped = [r for r in ALL if 'skipped' in r]
R = [r for r in ALL if 'skipped' not in r]
for r in skipped: print('Excluded:', r['rule'], r['title'], r['skipped'])
names = {r['rule']: r['title'] for r in R}
rules = sorted({r['rule'] for r in R})
ORDER = ['consistent', 'partial', 'never confirmed a failure', 'differs from expectation', 'off by default', 'not implemented']

def classify(tool, rs):
    st = rs[0][tool]['status']
    if st == 'unmapped': return 'not implemented', None
    if st == 'off': return 'off by default', None
    failed = [r for r in rs if r['expected'] == 'failed']
    ok = [r for r in rs if r['expected'] != 'failed']
    o = lambda r: r[tool]['outcome']
    n = dict(failed=len(failed), caught=sum(o(r) == 'failed' for r in failed),
             cant=sum(o(r) == 'cantTell' for r in failed), missed=sum(o(r) == 'notFailed' for r in failed),
             ok=len(ok), wrong=sum(o(r) == 'failed' for r in ok), okCant=sum(o(r) == 'cantTell' for r in ok))
    if n['wrong']: c = 'differs from expectation'
    elif n['missed'] == 0 and n['caught'] > 0: c = 'consistent'
    elif n['caught'] > 0: c = 'partial'
    else: c = 'never confirmed a failure'
    return c, n

print(f'{len(rules)} rules, {len(R)} test cases', dict(collections.Counter(r['expected'] for r in R)))
per = {}
for tool in ['axe', 'ibm']:
    cls = collections.Counter(); tot = collections.Counter(); per[tool] = {}
    for rid in rules:
        rs = [r for r in R if r['rule'] == rid]
        c, n = classify(tool, rs); cls[c] += 1; per[tool][rid] = (c, n)
        if n: tot.update(n)
    strict = sum(1 for c, n in per[tool].values() if n and n['wrong'] == 0 and n['caught'] == n['failed'])
    print(f'\n[{tool}]', {k: cls[k] for k in ORDER if cls[k]}, f'| rules that failed every failed example: {strict}')
    print(f'  failed examples {tot["failed"]}: failed {tot["caught"]}, cantTell {tot["cant"]}, missed {tot["missed"]}')
    print(f'  passed/inapplicable examples {tot["ok"]}: judged failed {tot["wrong"]}, cantTell {tot["okCant"]}')
    for rid, (c, n) in per[tool].items():
        if c != 'consistent': print(f'   {rid} {c:26} {n}')
    for r in R:
        if r[tool].get('outcome') == 'failed' and r['expected'] != 'failed':
            print('   differs from expectation:', r['rule'], r['title'], r['expected'], r[tool]['failedBy'], r['url'].rsplit('/', 1)[-1][:10])
json.dump(per, open('per-rule.json', 'w'), ensure_ascii=False, indent=1)

both = [r for r in R if r['axe']['status'] == 'ran' and r['ibm']['status'] == 'ran']
f = lambda r, t: r[t]['outcome'] == 'failed'
dis = [r for r in both if f(r, 'axe') != f(r, 'ibm')]
print(f'\nBoth tools ran {len({r["rule"] for r in both})} rules, {len(both)} test cases; they disagreed on fail/not-fail in {len(dis)} cases ({len({r["rule"] for r in dis})} rules)')
pat = collections.Counter()
for r in dis:
    who = 'axe' if f(r, 'axe') else 'ibm'; other = 'ibm' if who == 'axe' else 'axe'
    right = 'fail is correct' if r['expected'] == 'failed' else 'fail is not expected'
    pat[(f'only {who} failed', f'{other} said {r[other]["outcome"]}', right)] += 1
for k, v in pat.most_common(): print('  ', v, k)
for r in dis: print('   ', r['rule'], r['title'], r['expected'], 'axe', r['axe']['outcome'], 'ibm', r['ibm']['outcome'])
same3 = sum(1 for r in both if r['axe']['outcome'] == r['ibm']['outcome'])
print(f'Counting cantTell as its own answer: {same3} of {len(both)} agree')
