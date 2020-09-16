# RUN `ln -sf ../../pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit` to set this up as the git pre-commit hook

die () {
  echo ""
  echo "git pre-commit hook FAILED! See above for details."
  echo ""
	exit $@
}

npm run -s lint || die $?
npm run -s test || die $?
