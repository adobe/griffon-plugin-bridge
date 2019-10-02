SERVICE_NAME=griffon-plugin-bridge
# $sha is provided by jenkins
BUILDER_TAG?=$(or $(sha),$(SERVICE_NAME)-builder)
IMAGE_TAG=$(SERVICE_NAME)-img
BUILD_DOCKERFILE_NAME=Dockerfile.build.mt

default: ci

login:
ifeq ($(ARTIFACTORY_USER), )
	@echo "make sure that ARTIFACTORY_USER is set appropriately in your environment"
	exit 1
endif
ifeq ($(ARTIFACTORY_API_TOKEN), )
	@echo "make sure that ARTIFACTORY_API_TOKEN is set appropriately in your environment"
	exit 1
endif
	@echo docker login -u ARTIFACTORY_USER -p ARTIFACTORY_API_TOKEN docker-asr-release.dr.corp.adobe.com
	@docker login -u $(ARTIFACTORY_USER) -p $(ARTIFACTORY_API_TOKEN) docker-asr-release.dr.corp.adobe.com

ci: login
	docker build --build-arg USER_ID=`id -u` --build-arg GROUP_ID=`id -g` -t $(BUILDER_TAG) -f $(BUILD_DOCKERFILE_NAME) .
	@docker run \
		-v `pwd`:/build \
		-e TESSA2_API_KEY=$(TESSA2_API_KEY) \
		-e ARTIFACTORY_USER \
		-e ARTIFACTORY_API_TOKEN \
		--entrypoint "/bin/bash" \
		--rm \
		$(BUILDER_TAG) \
		-c "scripts/verify/verify.sh"

deploy: login
	docker build --build-arg USER_ID=`id -u` --build-arg GROUP_ID=`id -g` -t $(BUILDER_TAG) -f $(BUILD_DOCKERFILE_NAME) .
	@docker run \
		-v `pwd`:/build \
		-e TESSA2_API_KEY=$(TESSA2_API_KEY) \
		-e ARTIFACTORY_USER \
		-e ARTIFACTORY_API_TOKEN \
		-e SSH_KEY_PASSWORD \
		--entrypoint "/bin/bash" \
		--rm \
		$(BUILDER_TAG) \
		-c "mkdir /home/jenkins/.ssh; \
				echo \"$$SSH_PRIVATE_KEY_CONTENTS\" > /home/jenkins/.ssh/id_rsa; \
        printf \"Host gitHubEnterprise\n\tHostName git.corp.adobe.com\n\tUser git\n\tIdentityFile /home/jenkins/.ssh/id_rsa\n\" > /home/jenkins/.ssh/config; \
        ssh-keyscan git.corp.adobe.com > /home/jenkins/.ssh/known_hosts; \
        chmod -R 700 /home/jenkins/.ssh; \
        scripts/deploy/deploy.sh"

pre-deploy-build:
	echo "Nothing is defined in pre-deploy-build step"

build: ci
	echo "building with image tag"
	docker build -t $(IMAGE_TAG) .

post-deploy-build:
	echo "Nothing is defined in post-deploy-build step"

clean-room:
	# Docker Clean Room setup - https://wiki.corp.adobe.com/x/khu5TQ
	sh scripts/clean-room.sh
