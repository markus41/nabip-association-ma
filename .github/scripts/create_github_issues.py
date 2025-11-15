#!/usr/bin/env python3
"""
Script to create GitHub issues for feature requests with sub-issues and agent assignments.

This script reads the feature-requests-data.json file and creates GitHub issues
using the GitHub API.

Usage:
    python create_github_issues.py --token YOUR_GITHUB_TOKEN [--dry-run]

Requirements:
    pip install requests
"""

import json
import argparse
import sys
import time
from typing import Dict, List, Optional
import requests


class GitHubIssueCreator:
    """Creates GitHub issues from structured JSON data."""

    def __init__(self, token: str, repo: str = "markus41/nabip-association-ma", dry_run: bool = False):
        """
        Initialize the issue creator.
        
        Args:
            token: GitHub personal access token
            repo: Repository in format "owner/repo"
            dry_run: If True, print what would be created without actually creating issues
        """
        self.token = token
        self.repo = repo
        self.dry_run = dry_run
        self.base_url = f"https://api.github.com/repos/{repo}"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        self.created_issues = {}

    def create_issue(
        self,
        title: str,
        body: str,
        labels: List[str],
        assignees: Optional[List[str]] = None
    ) -> Optional[Dict]:
        """
        Create a GitHub issue.
        
        Args:
            title: Issue title
            body: Issue body (markdown)
            labels: List of labels to apply
            assignees: Optional list of GitHub usernames to assign
            
        Returns:
            Issue data dict if successful, None otherwise
        """
        if self.dry_run:
            print(f"\n[DRY RUN] Would create issue:")
            print(f"  Title: {title}")
            print(f"  Labels: {', '.join(labels)}")
            if assignees:
                print(f"  Assignees: {', '.join(assignees)}")
            print(f"  Body: {body[:100]}...")
            return {"number": 0, "html_url": "https://github.com/example/dry-run"}

        data = {
            "title": title,
            "body": body,
            "labels": labels
        }
        
        if assignees:
            data["assignees"] = assignees

        try:
            response = requests.post(
                f"{self.base_url}/issues",
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            issue_data = response.json()
            print(f"✓ Created issue #{issue_data['number']}: {title}")
            return issue_data
        except requests.exceptions.RequestException as e:
            print(f"✗ Failed to create issue '{title}': {e}", file=sys.stderr)
            return None

    def format_feature_request_body(self, feature: Dict) -> str:
        """Format the body for a feature request issue."""
        body_parts = [
            "## Problem Statement\n",
            feature["problem_statement"],
            "\n\n## Proposed Solution\n",
            feature["proposed_solution"],
            "\n\n## Expected Impact\n"
        ]
        
        for key, value in feature["expected_impact"].items():
            body_parts.append(f"- **{key.replace('_', ' ').title()}**: {value}\n")
        
        body_parts.append("\n## Priority\n")
        body_parts.append(feature["priority"])
        
        body_parts.append("\n\n## Sub-Issues\n")
        for sub in feature["sub_issues"]:
            body_parts.append(f"- [ ] Issue #{sub['number']}: {sub['title'].replace('[Sub-Issue]: ', '')}\n")
        
        return "".join(body_parts)

    def format_sub_issue_body(self, sub_issue: Dict, parent_number: Optional[int] = None) -> str:
        """Format the body for a sub-issue."""
        body_parts = []
        
        if parent_number:
            body_parts.append(f"## Parent Feature Request\n\n")
            body_parts.append(f"Part of #{parent_number}\n\n")
        
        body_parts.append("## Description\n\n")
        body_parts.append(sub_issue["description"])
        body_parts.append("\n\n## Assigned Agent(s)\n\n")
        
        for agent in sub_issue["agents"]:
            body_parts.append(f"**{agent}**\n")
        
        if "tasks" in sub_issue and sub_issue["tasks"]:
            body_parts.append("\n## Tasks\n\n")
            for task in sub_issue["tasks"]:
                body_parts.append(f"- [ ] {task}\n")
        
        body_parts.append("\n## Acceptance Criteria\n\n")
        body_parts.append("- [ ] Feature is fully implemented\n")
        body_parts.append("- [ ] Tests are passing\n")
        body_parts.append("- [ ] Code review completed\n")
        body_parts.append("- [ ] Documentation updated\n")
        body_parts.append("- [ ] Accessibility requirements met (WCAG 2.1 AA)\n")
        
        return "".join(body_parts)

    def create_feature_request_with_sub_issues(self, feature: Dict) -> None:
        """
        Create a feature request and all its sub-issues.
        
        Args:
            feature: Feature request data dictionary
        """
        print(f"\n{'='*70}")
        print(f"Creating Feature Request #{feature['id']}: {feature['title']}")
        print(f"{'='*70}")
        
        # Create the main feature request
        fr_body = self.format_feature_request_body(feature)
        fr_issue = self.create_issue(
            title=feature["title"],
            body=fr_body,
            labels=feature["labels"]
        )
        
        if not fr_issue:
            print(f"✗ Failed to create feature request, skipping sub-issues")
            return
        
        fr_number = fr_issue["number"]
        self.created_issues[feature["id"]] = {
            "feature_request": fr_issue,
            "sub_issues": []
        }
        
        # Wait a bit to avoid rate limiting
        time.sleep(1)
        
        # Create sub-issues
        print(f"\nCreating {len(feature['sub_issues'])} sub-issues...")
        for sub in feature["sub_issues"]:
            sub_body = self.format_sub_issue_body(sub, fr_number)
            sub_issue = self.create_issue(
                title=sub["title"],
                body=sub_body,
                labels=sub["labels"]
            )
            
            if sub_issue:
                self.created_issues[feature["id"]]["sub_issues"].append(sub_issue)
            
            # Wait to avoid rate limiting
            time.sleep(0.5)
        
        print(f"\n✓ Completed Feature Request #{feature['id']}")
        print(f"  Main issue: {fr_issue['html_url']}")
        print(f"  Sub-issues created: {len(self.created_issues[feature['id']]['sub_issues'])}")

    def create_all_from_json(self, json_file: str) -> None:
        """
        Create all feature requests and sub-issues from JSON file.
        
        Args:
            json_file: Path to the JSON file containing feature request data
        """
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"✗ Error reading JSON file: {e}", file=sys.stderr)
            sys.exit(1)
        
        print("="*70)
        print("GitHub Issue Creator for NABIP Association Management")
        print("="*70)
        print(f"Repository: {self.repo}")
        print(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        print(f"Feature Requests: {len(data['feature_requests'])}")
        total_sub_issues = sum(len(fr['sub_issues']) for fr in data['feature_requests'])
        print(f"Total Sub-Issues: {total_sub_issues}")
        print("="*70)
        
        if not self.dry_run:
            confirm = input("\nProceed with creating issues? (yes/no): ")
            if confirm.lower() != 'yes':
                print("Cancelled.")
                sys.exit(0)
        
        # Create each feature request with its sub-issues
        for feature in data["feature_requests"]:
            self.create_feature_request_with_sub_issues(feature)
        
        # Print summary
        print("\n" + "="*70)
        print("SUMMARY")
        print("="*70)
        print(f"Feature Requests Created: {len(self.created_issues)}")
        total_subs = sum(len(fr['sub_issues']) for fr in self.created_issues.values())
        print(f"Sub-Issues Created: {total_subs}")
        
        if not self.dry_run:
            print("\nAgent Assignment Summary:")
            if 'agent_summary' in data:
                for agent, info in data['agent_summary'].items():
                    print(f"\n{agent}:")
                    print(f"  Issues: {len(info['issues'])}")
                    print(f"  Description: {info['description']}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Create GitHub issues for NABIP feature requests"
    )
    parser.add_argument(
        "--token",
        required=True,
        help="GitHub personal access token"
    )
    parser.add_argument(
        "--repo",
        default="markus41/nabip-association-ma",
        help="Repository in format 'owner/repo'"
    )
    parser.add_argument(
        "--json-file",
        default="feature-requests-data.json",
        help="Path to JSON file with feature request data"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be created without actually creating issues"
    )
    
    args = parser.parse_args()
    
    creator = GitHubIssueCreator(
        token=args.token,
        repo=args.repo,
        dry_run=args.dry_run
    )
    
    creator.create_all_from_json(args.json_file)


if __name__ == "__main__":
    main()
