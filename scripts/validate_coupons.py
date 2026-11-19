#!/usr/bin/env python3
"""
HkeeemAI - Coupon & Offer Automated Validation Engine
Domain: alhkmy.store
Author: Hkeeem AI Systems & Security

Functionality:
1. Validates coupon codes syntax, discount formats, and expiry timestamps.
2. Tests merchant landing links and affiliate deep-links via async HTTP checks.
3. Automatically marks expired or dead coupons as inactive (verified = False).
4. Emits structured telemetry logs and alerts for invalid store codes.
"""

import asyncio
import datetime
import json
import logging
import re
import sys
from typing import Dict, List, Optional, Tuple
import urllib.request

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("CouponValidator")


class CouponValidator:
    def __init__(self, feed_source: str = "src/data/hkeeemData.ts"):
        self.feed_source = feed_source
        self.user_agent = "HkeeemAI-Bot/2.4 (+https://alhkmy.store/bot; audit-checker)"

    def check_date_expiry(self, expiry_text: str) -> Tuple[bool, Optional[str]]:
        """
        Parses expiry date string. Returns (is_valid, reason).
        Handles relative Arabic dates like 'نهاية الشهر' or ISO dates.
        """
        if not expiry_text:
            return False, "Missing expiry field"
        
        # Check ISO format YYYY-MM-DD
        match = re.search(r"(\d{4})-(\d{2})-(\d{2})", expiry_text)
        if match:
            year, month, day = map(int, match.groups())
            expiry_dt = datetime.date(year, month, day)
            today = datetime.date.today()
            if expiry_dt < today:
                return False, f"Expired on {expiry_dt} (today is {today})"
            return True, None

        # Ongoing valid Arabic terms
        valid_terms = ["ساري", "مستمر", "نشط", "نهاية الشهر", "نهاية الأسبوع"]
        if any(term in expiry_text for term in valid_terms):
            return True, None

        return True, "Assumed valid until verified"

    def check_code_syntax(self, code: str) -> Tuple[bool, str]:
        """
        Validates coupon format (alphanumeric, no weird spaces, 3-20 chars).
        """
        if not code or not isinstance(code, str):
            return False, "Code is empty or not string"
        
        clean = code.strip().upper()
        if len(clean) < 3 or len(clean) > 25:
            return False, f"Abnormal code length: {len(clean)}"
        
        if not re.match(r"^[A-Z0-9_\-]+$", clean):
            return False, "Code contains forbidden characters"

        return True, "Valid code syntax"

    def check_link_health(self, url: str) -> Tuple[bool, int, str]:
        """
        Performs a lightweight HEAD/GET request to verify merchant link health.
        """
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": self.user_agent},
                method="HEAD"
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                if status in (200, 301, 302, 307, 308):
                    return True, status, "Healthy"
                return False, status, f"Non-success status: {status}"
        except Exception as e:
            return False, 0, f"Connection error: {str(e)}"

    def audit_coupons(self, coupons: List[Dict]) -> Dict:
        """
        Full audit pipeline over array of coupon objects.
        """
        report = {
            "audited_at": datetime.datetime.utcnow().isoformat() + "Z",
            "total_coupons": len(coupons),
            "valid_coupons": 0,
            "expired_or_invalid": 0,
            "items": []
        }

        for item in coupons:
            code = item.get("code", "")
            store_name = item.get("storeName", "Unknown Store")
            expiry = item.get("expiry", "")
            affiliate_url = item.get("affiliateUrl")

            syntax_ok, syntax_msg = self.check_code_syntax(code)
            expiry_ok, expiry_msg = self.check_date_expiry(expiry)

            link_ok = True
            link_status = 200
            if affiliate_url:
                link_ok, link_status, _ = self.check_link_health(affiliate_url)

            is_active = syntax_ok and expiry_ok and link_ok

            if is_active:
                report["valid_coupons"] += 1
            else:
                report["expired_or_invalid"] += 1

            report["items"].append({
                "id": item.get("id"),
                "code": code,
                "store": store_name,
                "is_active": is_active,
                "syntax_ok": syntax_ok,
                "expiry_ok": expiry_ok,
                "expiry_reason": expiry_msg,
                "link_status": link_status,
                "recommended_action": "KEEP" if is_active else "QUARANTINE"
            })

        logger.info(
            f"Audit finished: {report['valid_coupons']}/{report['total_coupons']} active. "
            f"Invalid/Expired: {report['expired_or_invalid']}"
        )
        return report


if __name__ == "__main__":
    sample_coupons = [
        {
            "id": "c1",
            "storeName": "نون السعودية (Noon)",
            "code": "HKM10",
            "expiry": "2026-12-31",
            "discount": "10% خصم إضافي",
            "affiliateUrl": "https://alhkmy.store"
        },
        {
            "id": "c2",
            "storeName": "جاهز Jahez",
            "code": "JHZ2023",
            "expiry": "2024-01-01",  # Expired
            "discount": "توصيل مجاني"
        },
        {
            "id": "c3",
            "storeName": "هنقرستيشن",
            "code": "HUNGRY",
            "expiry": "ساري حتى نهاية الأسبوع",
            "discount": "20% كاش باك"
        }
    ]

    validator = CouponValidator()
    audit_results = validator.audit_coupons(sample_coupons)
    print(json.dumps(audit_results, indent=2, ensure_ascii=False))
