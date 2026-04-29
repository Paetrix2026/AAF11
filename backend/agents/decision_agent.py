from typing import Dict, List


class DecisionAgent:
    """
    Ranks safe drugs using a deterministic weighted score.
    """

    @staticmethod
    def _clamp(value: float, low: float, high: float) -> float:
        return max(low, min(high, value))

    def _normalize_binding(self, binding: float) -> float:
        # binding_norm = clamp((-binding - 4) / 6, 0, 1)
        raw = (-binding - 4.0) / 6.0
        return self._clamp(raw, 0.0, 1.0)

    def run(self, safe_drugs: List[Dict]) -> List[Dict]:
        if not safe_drugs:
            raise ValueError("DecisionAgent: 'safe_drugs' is required and cannot be empty.")

        ranked_drugs: List[Dict] = []
        for drug in safe_drugs:
            name = drug.get("name")
            binding = float(drug.get("binding", 0.0))
            resistance = float(drug.get("resistance", 0.0))
            patient_risk = float(drug.get("patient_risk", 0.0))

            binding_norm = self._normalize_binding(binding)
            score = (
                (0.5 * binding_norm)
                - (0.3 * resistance)
                - (0.2 * patient_risk)
            )

            ranked_drugs.append(
                {
                    "name": name,
                    "binding": binding,
                    "resistance": resistance,
                    "patient_risk": patient_risk,
                    "binding_norm": round(binding_norm, 4),
                    "score": round(score, 4),
                }
            )

        ranked_drugs.sort(key=lambda item: item["score"], reverse=True)
        return ranked_drugs
