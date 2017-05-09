#### USAGE #####################################################################
# make install      - to install external dependencies (`npm install`)
# make js           - to "compile" *.coffee to *.js
# make bin          - to generate optional ./bin/<botname> scripts
# make clean        - to remove generated files
# make really-clean - like `make clean` but also remove node_modules
################################################################################

#### META ######################################################################
# `.SUFFIXES` - reset suffixes in case any were previously defined
.SUFFIXES:
# `.PHONY` - make targets that aren't actually files
.PHONY: all install js clean clean-js clean-node-modules really-clean-node-modules really-clean bin clean-bin help
# `all` - the default target
all: bin
# `clean` - erase generated files
clean: clean-js clean-node-modules clean-bin clean-module clean-test-module-install
# `really-clean` - actually delete node-modules, rather than just `npm prune`-ing it.
really-clean: clean really-clean-node-modules
################################################################################

#### HELP ######################################################################
help:
	@echo "USE: make <target> [<target>...]"
	@echo ""
	@echo "Popular Targets:"
	@echo " make install      - install external dependencies ('npm install')"
	@echo " make js           - \"compile\" *.coffee to *.js"
	@echo " make bin          - generate optional ./bin/<botname> scripts"
	@echo " make module       - create npm-publishable module directory and tgz"
	@echo " make clean        - remove generated files"
	@echo " make really-clean - like 'make clean' but also delete node_modules"
	@echo "                     rather than just 'npm prune'-ing it"
	@echo ""

#### NPM #######################################################################
NPM_EXE ?= npm
PACKAGE_JSON ?= package.json
LICENSE_TXT ?= LICENSE.TXT
README_MD ?= README.md
NODE_MODULES ?= node_modules
NPM_ARGS ?= # --silent
MODULE_DIR ?= module
PACKAGE_VERSION ?= $(shell $(NODE_EXE) -e "console.log(require('./$(PACKAGE_JSON)').version)")
PACKAGE_NAME ?= $(shell $(NODE_EXE) -e "console.log(require('./$(PACKAGE_JSON)').name)")
TMP_PACKAGE_DIR ?= packaging-$(PACKAGE_NAME)-$(PACKAGE_VERSION)-tmp
PACKAGE_DIR ?= $(PACKAGE_NAME)-v$(PACKAGE_VERSION)
module: js bin
	mkdir -p $(MODULE_DIR)
	cp $(PACKAGE_JSON) $(MODULE_DIR)
	cp $(LICENSE_TXT) $(MODULE_DIR)
	cp $(README_MD) $(MODULE_DIR)
	cp -r bin $(MODULE_DIR)
	cp -r lib $(MODULE_DIR)
	mv $(MODULE_DIR) $(PACKAGE_DIR)
	tar -czf $(PACKAGE_DIR).tgz $(PACKAGE_DIR)
test-module-install: clean-test-module-install module
	mkdir ../testing-module-install; cd ../testing-module-install; npm install "$(CURDIR)/$(PACKAGE_DIR)"; node -e "require('assert').ok(require('team-one-bmf').BaseBot);" && cd $(CURDIR) && rm -rf ../testing-module-install && echo "It worked!"
clean-test-module-install:
	@rm -rf ../testing-module-install
clean-module:
	@rm -rf $(MODULE_DIR) $(PACKAGE_DIR) $(PACKAGE_DIR).tgz
$(NODE_MODULES): $(PACKAGE_JSON)
	$(NPM_EXE) $(NPM_ARGS) prune
	$(NPM_EXE) $(NPM_ARGS) install
	touch $(NODE_MODULES) # touch the module dir so it looks younger than `package.json`
install: $(NODE_MODULES) # an alias
clean-node-modules:
	@$(NPM_EXE) $(NPM_ARGS) prune
really-clean-node-modules: # deletes rather that simply pruning node_modules
	@rm -rf $(NODE_MODULES)
################################################################################


#### COFFEE ####################################################################
COFFEE_EXE          ?= ./node_modules/.bin/coffee
NODE_EXE            ?= node
COFFEE_COMPILE      ?= $(COFFEE_EXE) -c
COFFEE_COMPILE_ARGS ?=
COFFEE_SRCS         ?= $(shell find lib -type f -name '*.coffee')
COFFEE_JS           ?= ${COFFEE_SRCS:.coffee=.js}
js: node_modules $(COFFEE_JS) $(COFFEE_TEST_JS) $(COFFEE_SPEC_JS)
.SUFFIXES: .js .coffee
.coffee.js:
	@# compile .coffee to .js
	$(COFFEE_COMPILE) $(COFFEE_COMPILE_ARGS) $<
	@# make that .js file executable
	@# TODO it might be better to restrict this to the same list of files
	@#      found in the 'bin' target, but since this only applies to
	@#      *.coffee-sourced files we happen to know that it is save to to this.
	@echo '#!/usr/bin/env node' >> $@.tmp
	@cat $@ >> $@.tmp
	@mv $@.tmp $@
	@chmod a+x $@

$(COFFEE_JS_OBJ): $(PACKAGE_JSON) $(NODE_MODULES) $(COFFEE_SRCS)
clean-js:
	@rm -f $(COFFEE_JS) $(COFFEE_TEST_JS)
clean-coffee: clean-js
.coffee:
	$(COFFEE_EXE) $< >  $@
################################################################################

# TODO there's probably a more clever way to enumerate these files but the
#      brute-force approach works for now.  *.js won't work because not
#      every file is really an app
#### BIN #######################################################################
bin: clean-bin js
	@$(shell \
	  cd bin \
		&& ln -s ../lib/basic/basic-bot-coffee.js basic-bot-coffee \
		&& ln -s ../lib/basic/basic-bot-js.js basic-bot-js \
		&& ln -s ../lib/cleverbot/cleverbot-bot.js cleverbot-bot \
		&& ln -s ../lib/eliza/eliza-bot.js eliza-bot \
		&& ln -s ../lib/coin-flip/coin-flip-bot.js coin-flip-bot \
		&& ln -s ../lib/gmapsbot/gmapsbot.js gmapsbot \
	)
clean-bin:
	@rm -rf bin/basic-bot-coffee bin/basic-bot-js bin/cleverbot-bot bin/eliza-bot bin/coin-flip-bot bin/gmapsbot
################################################################################
