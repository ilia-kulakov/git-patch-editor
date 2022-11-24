# git-patch-editor
Script to modify git patch

Generate git patch
```
git format-patch -1 {commite-sha}
```

Apply git patch
```
git am < /c/tmp/live-copy/demo-content/inheritance.patch
```

Abort git patch
```
git am --abort
```
