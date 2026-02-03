.PHONY: publish

publish:
	@if [ -n "$(SKIP_BUILD)" ]; then \
		bash _sh_scripts/publish.sh --skip-build "$(MSG)"; \
	else \
		bash _sh_scripts/publish.sh "$(MSG)"; \
	fi
