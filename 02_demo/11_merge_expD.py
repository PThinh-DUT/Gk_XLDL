"""Gộp kết quả Thí nghiệm D chạy ở 2 tiến trình song song vào results/06_expD_training.json."""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
main_p = os.path.join(HERE, "results", "06_expD_training.json")
part_p = os.path.join(HERE, "results", "06_expD_training_part2.json")
main = json.load(open(main_p)) if os.path.exists(main_p) else []
part = json.load(open(part_p)) if os.path.exists(part_p) else []
order = ["FP32", "FP16 thuần", "Posit(16,1) thuần", "Posit(8,0) thuần", "Posit(8,2) thuần", "Posit(8,2)* hỗn hợp (O12L10)"]
merged = {(r["config"], r["seed"]): r for r in main + part}
out = sorted(merged.values(), key=lambda r: (r["seed"], order.index(r["config"])))
json.dump(out, open(main_p, "w"), indent=1, ensure_ascii=False)
for r in out:
    print(f"{r['config']:<30} seed={r['seed']} final={r['final_acc']:.2f}%")
