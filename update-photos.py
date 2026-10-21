#!/usr/bin/env python3
"""
Оновлює списки фото для всіх вкладок портфоліо.
Запускайте після того, як додали / видалили фото:   python update-photos.py

Папки (створюються автоматично):
  mix        -> «Усі роботи»
  kitchens   -> «Кухні»
  wardrobes  -> «Шафи та гардеробні»
  bedrooms   -> «Спальні»
  living     -> «Вітальні»
  offices    -> «Офіси та бізнес»
Назви файлів можуть бути будь-якими (jpg, jpeg, png, webp).
"""
import json, os, re

here = os.path.dirname(os.path.abspath(__file__))
folders = ["mix", "kitchens", "wardrobes", "bedrooms", "living", "offices"]
exts = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
nat = lambda s: [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

for name in folders:
    path = os.path.join(here, name)
    os.makedirs(path, exist_ok=True)
    files = sorted((f for f in os.listdir(path) if f.lower().endswith(exts)), key=nat)
    with open(os.path.join(path, "list.json"), "w", encoding="utf-8") as fh:
        json.dump(files, fh, ensure_ascii=False, indent=2)
    with open(os.path.join(path, "list.js"), "w", encoding="utf-8") as fh:
        fh.write("window.VERS_PHOTOS = window.VERS_PHOTOS || {};\n")
        fh.write("window.VERS_PHOTOS[%s] = %s;\n" % (json.dumps(name), json.dumps(files, ensure_ascii=False)))
    print(f"{name:10s} -> {len(files)} фото")
