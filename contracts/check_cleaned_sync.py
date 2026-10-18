"""Verify that a deployable *_cleaned.py blueprint has the same code as its documented source.

The cleaned files are what gets published on-chain. They may come from check_compressed_size.py
or be the exact source of an already-deployed blueprint (e.g. mainnet) with fixes applied, so
formatting can differ. This compares the ASTs with docstrings removed and fails on any code change.

Usage: python3 check_cleaned_sync.py dozer_pool_manager.py dozer_pool_manager_cleaned.py [...]
"""
import ast
import sys


def _normalized_dump(path: str) -> str:
    tree = ast.parse(open(path).read())
    for node in ast.walk(tree):
        if isinstance(node, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
            body = node.body
            if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant) \
                    and isinstance(body[0].value.value, str):
                node.body = body[1:] or [ast.Pass()]
    return ast.dump(tree, include_attributes=False)


def main(args: list[str]) -> int:
    if len(args) < 2 or len(args) % 2:
        print(__doc__)
        return 2
    ok = True
    for source, cleaned in zip(args[::2], args[1::2]):
        if _normalized_dump(source) == _normalized_dump(cleaned):
            print(f"{cleaned}: in sync with {source}")
        else:
            print(f"::error::{cleaned} does not match the code in {source}")
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
